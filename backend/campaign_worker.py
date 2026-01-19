import asyncio
import logging
import random
from datetime import datetime, time
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

from models import (
    Campaign, CampaignStatus, Contact, ContactStatus,
    MessageLog, MessageType, CampaignSettings
)
from waha_service import WahaService, replace_variables

logger = logging.getLogger(__name__)

# Global dict to track running campaigns
running_campaigns: Dict[str, asyncio.Task] = {}


def is_within_working_hours(settings: CampaignSettings) -> bool:
    """Check if current time is within working hours"""
    now = datetime.now()
    
    # Check working days (0 = Monday, 6 = Sunday)
    if now.weekday() not in settings.working_days:
        return False
    
    # Check time range
    if settings.start_time and settings.end_time:
        try:
            start = datetime.strptime(settings.start_time, "%H:%M").time()
            end = datetime.strptime(settings.end_time, "%H:%M").time()
            current_time = now.time()
            
            if start <= end:
                return start <= current_time <= end
            else:  # Crosses midnight
                return current_time >= start or current_time <= end
        except ValueError:
            return True
    
    return True


async def get_daily_sent_count(db: AsyncIOMotorDatabase, campaign_id: str) -> int:
    """Get number of messages sent today for a campaign"""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    count = await db.message_logs.count_documents({
        "campaign_id": campaign_id,
        "status": ContactStatus.SENT.value,
        "sent_at": {"$gte": today_start}
    })
    
    return count


async def process_campaign(
    db: AsyncIOMotorDatabase,
    campaign_id: str,
    waha_service: WahaService
):
    """Process a campaign - send messages to all pending contacts"""
    logger.info(f"Starting campaign worker for campaign {campaign_id}")
    
    try:
        while True:
            # Refresh campaign data
            campaign_data = await db.campaigns.find_one({"id": campaign_id})
            if not campaign_data:
                logger.error(f"Campaign {campaign_id} not found")
                break
            
            campaign = Campaign(**campaign_data)
            
            # Check if campaign should continue
            if campaign.status != CampaignStatus.RUNNING:
                logger.info(f"Campaign {campaign_id} is no longer running (status: {campaign.status})")
                break
            
            # Check working hours
            if not is_within_working_hours(campaign.settings):
                logger.info(f"Campaign {campaign_id} outside working hours, waiting...")
                await asyncio.sleep(60)  # Check again in 1 minute
                continue
            
            # Check daily limit
            if campaign.settings.daily_limit:
                daily_count = await get_daily_sent_count(db, campaign_id)
                if daily_count >= campaign.settings.daily_limit:
                    logger.info(f"Campaign {campaign_id} reached daily limit ({daily_count}/{campaign.settings.daily_limit})")
                    await asyncio.sleep(60)  # Check again in 1 minute
                    continue
            
            # Get next pending contact
            contact_data = await db.contacts.find_one({
                "campaign_id": campaign_id,
                "status": ContactStatus.PENDING.value
            })
            
            if not contact_data:
                # No more pending contacts - campaign completed
                await db.campaigns.update_one(
                    {"id": campaign_id},
                    {
                        "$set": {
                            "status": CampaignStatus.COMPLETED.value,
                            "completed_at": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                logger.info(f"Campaign {campaign_id} completed - no more pending contacts")
                break
            
            contact = Contact(**contact_data)
            
            # Prepare message with variables
            message_data = {
                "nome": contact.name,
                "name": contact.name,
                "telefone": contact.phone,
                "phone": contact.phone,
                "email": contact.email or "",
                "categoria": contact.category or "",
                "category": contact.category or "",
                **contact.extra_data
            }
            
            final_message = replace_variables(campaign.message.text, message_data)
            
            # Send message based on type
            result: Dict[str, Any]
            
            if campaign.message.type == MessageType.TEXT:
                result = await waha_service.send_text_message(
                    contact.phone,
                    final_message
                )
            elif campaign.message.type == MessageType.IMAGE:
                result = await waha_service.send_image_message(
                    contact.phone,
                    final_message,
                    image_url=campaign.message.media_url,
                    image_base64=campaign.message.media_base64
                )
            elif campaign.message.type == MessageType.DOCUMENT:
                result = await waha_service.send_document_message(
                    contact.phone,
                    final_message,
                    document_url=campaign.message.media_url,
                    document_base64=campaign.message.media_base64,
                    filename=campaign.message.media_filename or "document"
                )
            else:
                result = {"success": False, "error": "Unknown message type"}
            
            # Update contact status
            now = datetime.utcnow()
            if result.get("success"):
                new_status = ContactStatus.SENT
                error_msg = None
                
                # Update campaign counters
                await db.campaigns.update_one(
                    {"id": campaign_id},
                    {
                        "$inc": {"sent_count": 1, "pending_count": -1},
                        "$set": {"updated_at": now}
                    }
                )
            else:
                new_status = ContactStatus.ERROR
                error_msg = result.get("error", "Unknown error")
                
                # Update campaign counters
                await db.campaigns.update_one(
                    {"id": campaign_id},
                    {
                        "$inc": {"error_count": 1, "pending_count": -1},
                        "$set": {"updated_at": now}
                    }
                )
            
            # Update contact
            await db.contacts.update_one(
                {"id": contact.id},
                {
                    "$set": {
                        "status": new_status.value,
                        "error_message": error_msg,
                        "sent_at": now
                    }
                }
            )
            
            # Log message
            log = MessageLog(
                campaign_id=campaign_id,
                contact_id=contact.id,
                contact_name=contact.name,
                contact_phone=contact.phone,
                status=new_status,
                error_message=error_msg,
                message_sent=final_message,
                sent_at=now
            )
            await db.message_logs.insert_one(log.dict())
            
            logger.info(f"Message sent to {contact.phone}: {new_status.value}")
            
            # Wait for random interval
            interval = random.randint(
                campaign.settings.interval_min,
                campaign.settings.interval_max
            )
            logger.info(f"Waiting {interval} seconds before next message...")
            await asyncio.sleep(interval)
    
    except asyncio.CancelledError:
        logger.info(f"Campaign {campaign_id} worker cancelled")
        raise
    except Exception as e:
        logger.error(f"Error in campaign worker {campaign_id}: {e}")
        # Mark campaign as paused due to error
        await db.campaigns.update_one(
            {"id": campaign_id},
            {
                "$set": {
                    "status": CampaignStatus.PAUSED.value,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    finally:
        # Remove from running campaigns
        if campaign_id in running_campaigns:
            del running_campaigns[campaign_id]


async def start_campaign_worker(
    db: AsyncIOMotorDatabase,
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
