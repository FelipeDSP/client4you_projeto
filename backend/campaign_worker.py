import asyncio
import logging
import random
from datetime import datetime, time, timedelta
from typing import Optional, Dict, Any
from zoneinfo import ZoneInfo
import pytz # Importante para conversão segura

from models import (
    CampaignStatus, ContactStatus, MessageType, CampaignSettings
)
from waha_service import WahaService, replace_variables
from supabase_service import SupabaseService
from email_service import get_email_service

logger = logging.getLogger(__name__)

# Global dict to track running campaigns with thread-safe access
_campaigns_lock = asyncio.Lock()
running_campaigns: Dict[str, asyncio.Task] = {}

# Constants
WAIT_CHECK_INTERVAL = 60  # seconds
MAX_WAIT_CYCLES = 1440  # 24 hours (1440 minutes)


def get_campaign_timezone(company_settings: dict) -> ZoneInfo:
    """Get timezone for campaign based on company settings"""
    # Pega o timezone configurado na empresa ou usa SP como padrão
    tz_name = company_settings.get("timezone", "America/Sao_Paulo")
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
    # Pega a hora atual no fuso da empresa
    now = datetime.now(campaign_tz)
    
    # Check working days (0 = Monday, 6 = Sunday)
    working_days = settings.get("working_days", [0, 1, 2, 3, 4])
    
    # Python weekday(): 0=Mon, 6=Sun
    # Se o frontend enviar 0=Sun, 1=Mon, precisamos converter ou padronizar.
    # Assumindo que o Frontend agora envia padrão Python (0=Mon...):
    if now.weekday() not in working_days:
        # Debug log
        # logger.debug(f"Hoje ({now.weekday()}) não é dia de envio: {working_days}")
        return False
    
    # Check time range
    start_time_str = settings.get("start_time")
    end_time_str = settings.get("end_time")
    
    if start_time_str and end_time_str:
        try:
            start = datetime.strptime(start_time_str, "%H:%M").time()
            end = datetime.strptime(end_time_str, "%H:%M").time()
            current_time = now.time()
            
            if start <= end:
                # Normal hours (e.g., 09:00 to 18:00)
                is_time = start <= current_time <= end
            else:
                # Crosses midnight (e.g., 22:00 to 02:00)
                is_time = current_time >= start or current_time <= end
            
            if not is_time:
                # logger.debug(f"Fora do horário: Agora {current_time}, Limites {start}-{end}")
                pass
            return is_time

        except ValueError as e:
            logger.warning(f"Invalid time format in settings: {e}")
            return True # Fail safe: allow sending
    
    return True


async def process_campaign(
    db: SupabaseService,
    campaign_id: str,
    waha_service: WahaService
):
    """Process a campaign - send messages to all pending contacts"""
    logger.info(f"Starting campaign worker for campaign {campaign_id}")
    
    wait_cycles = 0
    campaign_tz = None
    
    try:
        # 1. Fetch campaign data once at start
        campaign_data = await db.get_campaign(campaign_id)
        if not campaign_data:
            logger.error(f"Campaign {campaign_id} not found")
            return
        
        # 2. Fetch Company Settings (Timezone)
        company_id = campaign_data.get('company_id')
        # Usa o novo método que criamos no supabase_service
        company_settings = await db.get_company_settings_with_timezone(company_id)
        
        # 3. Define timezone da campanha
        campaign_tz = get_campaign_timezone(company_settings)
        logger.info(f"Campaign {campaign_id} (Company {company_id}) using timezone: {campaign_tz}")
        
        # Cache settings that don't change
        settings = {
            "working_days": campaign_data.get("working_days", [0, 1, 2, 3, 4]),
            "start_time": campaign_data.get("start_time"),
            "end_time": campaign_data.get("end_time"),
            "daily_limit": campaign_data.get("daily_limit"),
            "interval_min": campaign_data.get("interval_min", 30),
            "interval_max": campaign_data.get("interval_max", 60)
        }
        
        while True:
            # Check campaign status (lightweight query)
            status_result = db.client.table('campaigns')\
                .select('status, pending_count')\
                .eq('id', campaign_id)\
                .single()\
                .execute()
            
            if not status_result.data:
                logger.error(f"Campaign {campaign_id} not found - stopping worker")
                break
            
            # Check if campaign should continue
            if status_result.data.get("status") != "running":
                logger.info(f"Campaign {campaign_id} is no longer running (status: {status_result.data.get('status')})")
                break
            
            pending_count = status_result.data.get("pending_count", 0)
            
            # 4. Check working hours (Timezone Aware)
            if not is_within_working_hours(settings, campaign_tz):
                wait_cycles += 1
                
                # Marcar campanha como "aguardando horário" para reduzir polling do frontend
                if wait_cycles == 1:
                    # Primeira vez fora do horário, atualizar flag
                    await db.update_campaign(campaign_id, {"is_actively_sending": False})
                
                # Timeout after 24h waiting (prevent zombies)
                if wait_cycles >= MAX_WAIT_CYCLES:
                    logger.warning(f"Campaign {campaign_id} waited 24h outside working hours - pausing")
                    await db.update_campaign(campaign_id, {"status": "paused", "is_actively_sending": False})
                    break
                
                # Log only every 60 cycles (1 hour) to reduce noise
                if wait_cycles % 60 == 1:
                    logger.info(f"Campaign {campaign_id} outside working hours ({campaign_tz}), waiting... ({wait_cycles}/{MAX_WAIT_CYCLES})")
                
                # Aumentar intervalo de verificação para 5 minutos quando está só esperando
                await asyncio.sleep(300)  # 5 minutos ao invés de 60 segundos
                continue
            
            # Reset wait cycles when inside working hours
            wait_cycles = 0
            
            # Marcar campanha como "enviando ativamente"
            if pending_count > 0:
                await db.update_campaign(campaign_id, {"is_actively_sending": True})
            
            # Check daily limit
            if settings.get("daily_limit"):
                daily_count = await db.count_messages_sent_today(campaign_id)
                if daily_count >= settings["daily_limit"]:
                    logger.info(f"Campaign {campaign_id} reached daily limit ({daily_count}) - waiting for next day")
                    
                    # Calculate time until midnight in CAMPAIGN TIMEZONE
                    now = datetime.now(campaign_tz)
                    tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
                    seconds_until_tomorrow = (tomorrow - now).total_seconds()
                    
                    # Wait in chunks
                    chunks = int(seconds_until_tomorrow / WAIT_CHECK_INTERVAL)
                    for _ in range(max(chunks, 1)):
                        await asyncio.sleep(WAIT_CHECK_INTERVAL)
                        
                        # Re-check status
                        status_check = db.client.table('campaigns')\
                            .select('status')\
                            .eq('id', campaign_id)\
                            .single()\
                            .execute()
                        
                        if not status_check.data or status_check.data.get("status") != "running":
                            logger.info(f"Campaign {campaign_id} status changed during daily limit wait")
                            return
                    continue
            
            # Get next pending contact
            contact_data = await db.get_next_pending_contact(campaign_id)
            
            if not contact_data:
                # No more pending contacts - campaign completed
                await db.update_campaign(campaign_id, {
                    "status": "completed",
                    "completed_at": datetime.now(campaign_tz).isoformat()
                })
                logger.info(f"Campaign {campaign_id} completed - all contacts processed")
                
                # ENVIAR EMAIL DE CONCLUSÃO
                try:
                    campaign_final = await db.get_campaign(campaign_id)
                    if campaign_final:
                        user_result = db.client.table('profiles')\
                            .select('email, full_name')\
                            .eq('id', campaign_final.get('user_id'))\
                            .single()\
                            .execute()
                        
                        if user_result.data:
                            email_service = get_email_service()
                            await email_service.send_campaign_completed(
                                user_email=user_result.data.get('email'),
                                user_name=user_result.data.get('full_name', 'Usuário'),
                                campaign_name=campaign_final.get('name', 'Campanha'),
                                total_sent=campaign_final.get('sent_count', 0),
                                total_errors=campaign_final.get('error_count', 0),
                                total_contacts=campaign_final.get('total_contacts', 0),
                                campaign_id=campaign_id
                            )
                            logger.info(f"📧 Email de conclusão enviado para {user_result.data.get('email')}")
                except Exception as e:
                    logger.error(f"❌ Erro ao enviar email de conclusão: {e}")
                
                break
            
            # Prepare message with variables
            # Re-fetch only message fields
            message_result = db.client.table('campaigns')\
                .select('message_text, message_type, media_url, media_filename, sent_count, error_count')\
                .eq('id', campaign_id)\
                .single()\
                .execute()
            
            if not message_result.data:
                logger.error(f"Campaign {campaign_id} message data not found")
                break
            
            extra_data = contact_data.get("extra_data", {})
            message_data = {
                "nome": contact_data.get("name", ""),
                "name": contact_data.get("name", ""),
                "telefone": contact_data.get("phone", ""),
                "phone": contact_data.get("phone", ""),
                "email": contact_data.get("email") or "",
                "categoria": contact_data.get("category") or "",
                "category": contact_data.get("category") or "",
                "empresa": "Sua Empresa", # Fallback default
                **(extra_data if isinstance(extra_data, dict) else {})
            }
            
            message_text = message_result.data.get("message_text", "")
            final_message = replace_variables(message_text, message_data)
            
            # Send message based on type
            message_type = message_result.data.get("message_type", "text")
            result: Dict[str, Any]
            
            # DISPARO EFETIVO NO WAHA
            if message_type == "text":
                result = await waha_service.send_text_message(
                    contact_data["phone"],
                    final_message
                )
            elif message_type == "image":
                result = await waha_service.send_image_message(
                    contact_data["phone"],
                    final_message,
                    image_url=message_result.data.get("media_url")
                )
            elif message_type == "document":
                result = await waha_service.send_document_message(
                    contact_data["phone"],
                    final_message,
                    document_url=message_result.data.get("media_url"),
                    filename=message_result.data.get("media_filename") or "document"
                )
            else:
                result = {"success": False, "error": "Unknown message type"}
            
            # Update contact status
            now_iso = datetime.now(campaign_tz).isoformat()
            
            if result.get("success"):
                new_status = "sent"
                error_msg = None
                
                # Update campaign counters
                sent_count = (message_result.data.get("sent_count") or 0) + 1
                pending_count = max(pending_count - 1, 0)
                await db.update_campaign(campaign_id, {
                    "sent_count": sent_count,
                    "pending_count": pending_count
                })
                logger.info(f"Message sent to {contact_data['phone']} successfully")
            else:
                new_status = "error"
                raw_error = result.get("error", "Unknown error")
                error_msg = sanitize_error_message(raw_error)
                
                logger.warning(f"Failed to send message to {contact_data['phone']}: {raw_error}")
                
                # Update campaign counters
                error_count = (message_result.data.get("error_count") or 0) + 1
                pending_count = max(pending_count - 1, 0)
                await db.update_campaign(campaign_id, {
                    "error_count": error_count,
                    "pending_count": pending_count
                })
            
            # Update contact
            await db.update_contact(contact_data["id"], {
                "status": new_status,
                "error_message": error_msg,
                "sent_at": now_iso
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
                "sent_at": now_iso
            }
            await db.create_message_log(log_data)
            
            # Wait for random interval only if there are more contacts
            if pending_count > 0:
                interval = random.randint(
                    settings.get("interval_min", 30),
                    settings.get("interval_max", 60)
                )
                logger.info(f"Waiting {interval} seconds before next message... ({pending_count} remaining)")
                await asyncio.sleep(interval)
            else:
                # This was the last contact
                logger.info("Last message sent, campaign will complete in next iteration")
    
    except asyncio.CancelledError:
        logger.info(f"Campaign {campaign_id} worker cancelled")
        raise  # Re-raise to be handled in finally
    except Exception as e:
        logger.error(f"Error in campaign worker {campaign_id}: {e}", exc_info=True)
        # Mark campaign as paused due to error
        try:
            await db.update_campaign(campaign_id, {
                "status": "paused"
            })
            
            campaign = await db.get_campaign(campaign_id)
            if campaign:
                await db.create_notification(
                    user_id=campaign.get("user_id"),
                    company_id=campaign.get("company_id"),
                    notification_type="campaign_error",
                    title="❌ Erro na Campanha",
                    message=f"A campanha '{campaign.get('name')}' foi pausada devido a um erro: {sanitize_error_message(str(e))}",
                    link="/disparador"
                )
        except Exception as notification_error:
            logger.error(f"Failed to create error notification: {notification_error}")
    finally:
        # Always remove from tracking, even in case of error
        async with _campaigns_lock:
            if campaign_id in running_campaigns:
                del running_campaigns[campaign_id]
                logger.info(f"Campaign {campaign_id} removed from running campaigns")


async def start_campaign_worker(
    db: SupabaseService,
    campaign_id: str,
    waha_service: WahaService
) -> tuple[bool, Optional[str]]:
    """
    Start a campaign worker task - thread-safe with atomic check
    """
    async with _campaigns_lock:
        if campaign_id in running_campaigns:
            task = running_campaigns[campaign_id]
            if not task.done():
                return False, "Campanha já está em execução"
            else:
                del running_campaigns[campaign_id]
                logger.warning(f"Cleaned up dead task for campaign {campaign_id}")
        
        task = asyncio.create_task(
            process_campaign(db, campaign_id, waha_service)
        )
        running_campaigns[campaign_id] = task
        logger.info(f"Started worker for campaign {campaign_id}")
    
    return True, None


async def stop_campaign_worker(campaign_id: str) -> bool:
    """Stop a campaign worker task - thread-safe"""
    task = None
    
    async with _campaigns_lock:
        if campaign_id not in running_campaigns:
            return False
        
        task = running_campaigns[campaign_id]
        task.cancel()
    
    try:
        await task
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Error while stopping campaign {campaign_id}: {e}")
    
    async with _campaigns_lock:
        if campaign_id in running_campaigns:
            del running_campaigns[campaign_id]
            logger.info(f"Stopped worker for campaign {campaign_id}")
    
    return True


def is_campaign_running(campaign_id: str) -> bool:
    """Check if a campaign worker is running"""
    return campaign_id in running_campaigns and not running_campaigns[campaign_id].done()