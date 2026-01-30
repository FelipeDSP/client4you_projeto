import asyncio
import logging
import random
from datetime import datetime, time, timedelta
from typing import Optional, Dict, Any
from zoneinfo import ZoneInfo

from models import (
    CampaignStatus, ContactStatus, MessageType, CampaignSettings
)
from waha_service import WahaService, replace_variables
from supabase_service import SupabaseService

logger = logging.getLogger(__name__)

# Global dict to track running campaigns with thread-safe access
_campaigns_lock = asyncio.Lock()
running_campaigns: Dict[str, asyncio.Task] = {}

# Constants
WAIT_CHECK_INTERVAL = 60  # seconds
MAX_WAIT_CYCLES = 1440  # 24 hours (1440 minutes)


def get_campaign_timezone(campaign_data: dict) -> ZoneInfo:
    """Get timezone for campaign (default to Brazil/São Paulo)"""
    tz_name = campaign_data.get("timezone", "America/Sao_Paulo")
    try:
        return ZoneInfo(tz_name)
    except Exception:
        logger.warning(f"Invalid timezone {tz_name}, using America/Sao_Paulo")
        return ZoneInfo("America/Sao_Paulo")


def sanitize_error_message(error_msg: str, max_length: int = 200) -> str:
    """
    Sanitize error message before saving to database.
    Remove sensitive information and limit size.
    """
    if not error_msg:
        return "Erro desconhecido"
    
    import re
    
    # Remove possible API keys (long alphanumeric sequences)
    error_msg = re.sub(r'\b[A-Za-z0-9_-]{30,}\b', '[REDACTED]', error_msg)
    
    # Remove IPs
    error_msg = re.sub(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '[IP]', error_msg)
    
    # Remove full URLs (keep only domain)
    error_msg = re.sub(r'https?://[^\s]+', '[URL]', error_msg)
    
    # Limit size
    if len(error_msg) > max_length:
        error_msg = error_msg[:max_length] + "..."
    
    return error_msg


def is_within_working_hours(settings: dict, campaign_tz: ZoneInfo) -> bool:
    """Check if current time is within working hours - timezone aware"""
    now = datetime.now(campaign_tz)
    
    # Check working days (0 = Monday, 6 = Sunday)
    working_days = settings.get("working_days", [0, 1, 2, 3, 4])
    if now.weekday() not in working_days:
        return False
    
    # Check time range
    start_time = settings.get("start_time")
    end_time = settings.get("end_time")
    
    if start_time and end_time:
        try:
            start = datetime.strptime(start_time, "%H:%M").time()
            end = datetime.strptime(end_time, "%H:%M").time()
            current_time = now.time()
            
            if start <= end:
                # Normal hours (e.g., 09:00 to 18:00)
                return start <= current_time <= end
            else:
                # Crosses midnight (e.g., 22:00 to 02:00)
                return current_time >= start or current_time <= end
        except ValueError as e:
            logger.warning(f"Invalid time format: {e}")
            return True
    
    return True


async def process_campaign(
    db: SupabaseService,
    campaign_id: str,
    waha_service: WahaService
):
    """Process a campaign - send messages to all pending contacts"""
    logger.info(f"Starting campaign worker for campaign {campaign_id}")
    
    try:
        while True:
            # Refresh campaign data
            campaign_data = await db.get_campaign(campaign_id)
            if not campaign_data:
                logger.error(f"Campaign {campaign_id} not found")
                break
            
            # Check if campaign should continue
            if campaign_data.get("status") != "running":
                logger.info(f"Campaign {campaign_id} is no longer running (status: {campaign_data.get('status')})")
                break
            
            # Build settings dict
            settings = {
                "working_days": campaign_data.get("working_days", [0, 1, 2, 3, 4]),
                "start_time": campaign_data.get("start_time"),
                "end_time": campaign_data.get("end_time"),
                "daily_limit": campaign_data.get("daily_limit"),
                "interval_min": campaign_data.get("interval_min", 30),
                "interval_max": campaign_data.get("interval_max", 60)
            }
            
            # Check working hours
            if not is_within_working_hours(settings):
                logger.info(f"Campaign {campaign_id} outside working hours, waiting...")
                await asyncio.sleep(60)  # Check again in 1 minute
                continue
            
            # Check daily limit
            if settings.get("daily_limit"):
                daily_count = await db.count_messages_sent_today(campaign_id)
                if daily_count >= settings["daily_limit"]:
                    logger.info(f"Campaign {campaign_id} reached daily limit ({daily_count}/{settings['daily_limit']})")
                    await asyncio.sleep(60)  # Check again in 1 minute
                    continue
            
            # Get next pending contact
            contact_data = await db.get_next_pending_contact(campaign_id)
            
            if not contact_data:
                # No more pending contacts - campaign completed
                await db.update_campaign(campaign_id, {
                    "status": "completed",
                    "completed_at": datetime.utcnow().isoformat()
                })
                logger.info(f"Campaign {campaign_id} completed - no more pending contacts")
                
                # Create notification for campaign completion
                try:
                    campaign = await db.get_campaign(campaign_id)
                    if campaign:
                        await db.create_notification(
                            user_id=campaign.get("user_id"),
                            company_id=campaign.get("company_id"),
                            notification_type="campaign_completed",
                            title="Campanha Concluída! 🎉",
                            message=f"A campanha '{campaign.get('name')}' foi concluída com sucesso. {campaign.get('sent_count', 0)} mensagens enviadas.",
                            link=f"/disparador",
                            metadata={"campaign_id": campaign_id, "sent_count": campaign.get('sent_count', 0)}
                        )
                        logger.info(f"Notification created for completed campaign {campaign_id}")
                except Exception as e:
                    logger.error(f"Error creating completion notification: {e}")
                
                break
            
            # Prepare message with variables
            extra_data = contact_data.get("extra_data", {})
            message_data = {
                "nome": contact_data.get("name", ""),
                "name": contact_data.get("name", ""),
                "telefone": contact_data.get("phone", ""),
                "phone": contact_data.get("phone", ""),
                "email": contact_data.get("email") or "",
                "categoria": contact_data.get("category") or "",
                "category": contact_data.get("category") or "",
                **(extra_data if isinstance(extra_data, dict) else {})
            }
            
            message_text = campaign_data.get("message_text", "")
            final_message = replace_variables(message_text, message_data)
            
            # Send message based on type
            message_type = campaign_data.get("message_type", "text")
            result: Dict[str, Any]
            
            if message_type == "text":
                result = await waha_service.send_text_message(
                    contact_data["phone"],
                    final_message
                )
            elif message_type == "image":
                result = await waha_service.send_image_message(
                    contact_data["phone"],
                    final_message,
                    image_url=campaign_data.get("media_url")
                )
            elif message_type == "document":
                result = await waha_service.send_document_message(
                    contact_data["phone"],
                    final_message,
                    document_url=campaign_data.get("media_url"),
                    filename=campaign_data.get("media_filename") or "document"
                )
            else:
                result = {"success": False, "error": "Unknown message type"}
            
            # Update contact status
            now = datetime.utcnow().isoformat()
            if result.get("success"):
                new_status = "sent"
                error_msg = None
                
                # Update campaign counters
                sent_count = (campaign_data.get("sent_count") or 0) + 1
                pending_count = max((campaign_data.get("pending_count") or 0) - 1, 0)
                await db.update_campaign(campaign_id, {
                    "sent_count": sent_count,
                    "pending_count": pending_count
                })
            else:
                new_status = "error"
                error_msg = result.get("error", "Unknown error")
                
                # Update campaign counters
                error_count = (campaign_data.get("error_count") or 0) + 1
                pending_count = max((campaign_data.get("pending_count") or 0) - 1, 0)
                await db.update_campaign(campaign_id, {
                    "error_count": error_count,
                    "pending_count": pending_count
                })
            
            # Update contact
            await db.update_contact(contact_data["id"], {
                "status": new_status,
                "error_message": error_msg,
                "sent_at": now
            })
            
            # Log message
            log_data = {
                "campaign_id": campaign_id,
                "contact_id": contact_data["id"],
                "contact_name": contact_data.get("name"),
                "contact_phone": contact_data.get("phone"),
                "status": new_status,
                "error_message": error_msg,
                "message_sent": final_message,
                "sent_at": now
            }
            await db.create_message_log(log_data)
            
            logger.info(f"Message sent to {contact_data['phone']}: {new_status}")
            
            # Check if there are more pending contacts before waiting
            remaining_contacts = await db.get_next_pending_contact(campaign_id)
            
            if remaining_contacts:
                # Wait for random interval only if there are more contacts
                interval = random.randint(
                    settings.get("interval_min", 30),
                    settings.get("interval_max", 60)
                )
                logger.info(f"Waiting {interval} seconds before next message...")
                await asyncio.sleep(interval)
            else:
                # No more contacts, will complete in next iteration
                logger.info(f"Last message sent, campaign will complete in next iteration")
    
    except asyncio.CancelledError:
        logger.info(f"Campaign {campaign_id} worker cancelled")
        raise
    except Exception as e:
        logger.error(f"Error in campaign worker {campaign_id}: {e}")
        # Mark campaign as paused due to error
        await db.update_campaign(campaign_id, {"status": "paused"})
    finally:
        # Remove from running campaigns
        if campaign_id in running_campaigns:
            del running_campaigns[campaign_id]


async def start_campaign_worker(
    db: SupabaseService,
    campaign_id: str,
    waha_service: WahaService
) -> bool:
    """Start a campaign worker task"""
    if campaign_id in running_campaigns:
        logger.warning(f"Campaign {campaign_id} worker already running")
        return False
    
    task = asyncio.create_task(
        process_campaign(db, campaign_id, waha_service)
    )
    running_campaigns[campaign_id] = task
    
    return True


async def stop_campaign_worker(campaign_id: str) -> bool:
    """Stop a campaign worker task"""
    if campaign_id not in running_campaigns:
        return False
    
    task = running_campaigns[campaign_id]
    task.cancel()
    
    try:
        await task
    except asyncio.CancelledError:
        pass
    
    if campaign_id in running_campaigns:
        del running_campaigns[campaign_id]
    
    return True


def is_campaign_running(campaign_id: str) -> bool:
    """Check if a campaign worker is running"""
    return campaign_id in running_campaigns
