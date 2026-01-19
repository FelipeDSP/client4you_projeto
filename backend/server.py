from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import pandas as pd
import io

from models import (
    WahaConfig, WahaConfigCreate,
    Campaign, CampaignCreate, CampaignUpdate, CampaignStatus, CampaignStats, CampaignWithStats,
    Contact, ContactStatus, MessageLog, CampaignSettings, CampaignMessage
)
from waha_service import WahaService
from campaign_worker import (
    start_campaign_worker, stop_campaign_worker, is_campaign_running
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'lead_dispatcher')]

# Create the main app
app = FastAPI(title="Lead Dispatcher API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ========== Helper Functions ==========
async def get_waha_service(user_id: str) -> Optional[WahaService]:
    """Get WAHA service for a user"""
    config_data = await db.waha_configs.find_one({"user_id": user_id})
    if not config_data:
        return None
    
    config = WahaConfig(**config_data)
    return WahaService(config.waha_url, config.api_key, config.session_name)


def calculate_campaign_stats(campaign: dict) -> CampaignStats:
    """Calculate campaign statistics"""
    total = campaign.get("total_contacts", 0)
    sent = campaign.get("sent_count", 0)
    errors = campaign.get("error_count", 0)
    pending = campaign.get("pending_count", 0)
    
    progress = (sent / total * 100) if total > 0 else 0
    
    return CampaignStats(
        total=total,
        sent=sent,
        pending=pending,
        errors=errors,
        progress_percent=round(progress, 1)
    )


# ========== Root Endpoint ==========
@api_router.get("/")
async def root():
    return {"message": "Lead Dispatcher API", "version": "1.0.0"}


# ========== WAHA Config Endpoints ==========
@api_router.post("/waha/config")
async def save_waha_config(config: WahaConfigCreate, user_id: str = "default"):
    """Save or update WAHA configuration"""
    existing = await db.waha_configs.find_one({"user_id": user_id})
    
    now = datetime.utcnow()
    
    if existing:
        # Update existing
        await db.waha_configs.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "waha_url": config.waha_url,
                    "api_key": config.api_key,
                    "session_name": config.session_name,
                    "updated_at": now
                }
            }
        )
        config_obj = WahaConfig(**{**existing, **config.dict(), "updated_at": now})
    else:
        # Create new
        config_obj = WahaConfig(
            user_id=user_id,
            **config.dict()
        )
        await db.waha_configs.insert_one(config_obj.dict())
    
    return {"success": True, "config": config_obj}


@api_router.get("/waha/config")
async def get_waha_config(user_id: str = "default"):
    """Get WAHA configuration"""
    config_data = await db.waha_configs.find_one({"user_id": user_id})
    
    if not config_data:
        return {"config": None}
    
    config = WahaConfig(**config_data)
    # Hide API key in response
    return {
        "config": {
            "id": config.id,
            "waha_url": config.waha_url,
            "api_key": config.api_key[:10] + "..." if len(config.api_key) > 10 else "***",
            "session_name": config.session_name,
            "is_connected": config.is_connected,
            "last_check": config.last_check
        }
    }


@api_router.post("/waha/test")
async def test_waha_connection(user_id: str = "default"):
    """Test WAHA connection"""
    waha = await get_waha_service(user_id)
    
    if not waha:
        raise HTTPException(status_code=400, detail="Configuração WAHA não encontrada")
    
    result = await waha.check_connection()
    
    # Update connection status
    await db.waha_configs.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "is_connected": result.get("connected", False),
                "last_check": datetime.utcnow()
            }
        }
    )
    
    return result


# ========== Campaign Endpoints ==========
@api_router.post("/campaigns", response_model=Campaign)
async def create_campaign(campaign: CampaignCreate, user_id: str = "default"):
    """Create a new campaign"""
    campaign_obj = Campaign(
        user_id=user_id,
        name=campaign.name,
        message=campaign.message,
        settings=campaign.settings
    )
    
    await db.campaigns.insert_one(campaign_obj.dict())
    
    return campaign_obj


@api_router.get("/campaigns")
async def list_campaigns(user_id: str = "default", limit: int = 50, skip: int = 0):
    """List all campaigns for a user"""
    campaigns_data = await db.campaigns.find(
        {"user_id": user_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    campaigns_with_stats = []
    for c in campaigns_data:
        campaign = Campaign(**c)
        stats = calculate_campaign_stats(c)
        campaign_dict = campaign.dict()
        campaign_dict["stats"] = stats.dict()
        campaign_dict["is_worker_running"] = is_campaign_running(campaign.id)
        campaigns_with_stats.append(campaign_dict)
    
    return {"campaigns": campaigns_with_stats}


@api_router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign details"""
    campaign_data = await db.campaigns.find_one({"id": campaign_id})
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    campaign = Campaign(**campaign_data)
    stats = calculate_campaign_stats(campaign_data)
    
    return {
        "campaign": campaign,
        "stats": stats,
        "is_worker_running": is_campaign_running(campaign_id)
    }


@api_router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, update: CampaignUpdate):
    """Update campaign"""
    campaign_data = await db.campaigns.find_one({"id": campaign_id})
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    
    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()
        
        # Handle nested objects
        if "message" in update_dict:
            update_dict["message"] = update_dict["message"].dict() if hasattr(update_dict["message"], 'dict') else update_dict["message"]
        if "settings" in update_dict:
            update_dict["settings"] = update_dict["settings"].dict() if hasattr(update_dict["settings"], 'dict') else update_dict["settings"]
        
        await db.campaigns.update_one(
            {"id": campaign_id},
            {"$set": update_dict}
        )
    
    updated = await db.campaigns.find_one({"id": campaign_id})
    return Campaign(**updated)


@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str):
    """Delete campaign and all associated data"""
    # Stop worker if running
    await stop_campaign_worker(campaign_id)
    
    # Delete contacts
    await db.contacts.delete_many({"campaign_id": campaign_id})
    
    # Delete message logs
    await db.message_logs.delete_many({"campaign_id": campaign_id})
    
    # Delete campaign
    result = await db.campaigns.delete_one({"id": campaign_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    return {"success": True, "message": "Campanha excluída com sucesso"}


# ========== Upload & Contacts ==========
@api_router.post("/campaigns/{campaign_id}/upload")
async def upload_contacts(
    campaign_id: str,
    file: UploadFile = File(...),
    phone_column: str = Form(default="Telefone"),
    name_column: str = Form(default="Nome")
):
    """Upload contacts from Excel/CSV file"""
    campaign_data = await db.campaigns.find_one({"id": campaign_id})
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    # Read file
    content = await file.read()
    
    try:
        # Try to read as Excel first, then CSV
        if file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(content))
        else:
            # Try different encodings for CSV
            try:
                df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
            except:
                df = pd.read_csv(io.BytesIO(content), encoding='latin-1')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler arquivo: {str(e)}")
    
    # Normalize column names (remove spaces, lowercase)
    df.columns = df.columns.str.strip()
    
    # Find matching columns (case-insensitive)
    phone_col = None
    name_col = None
    
    for col in df.columns:
        col_lower = col.lower()
        if phone_column.lower() in col_lower or col_lower in ['telefone', 'phone', 'tel', 'celular', 'whatsapp']:
            phone_col = col
        if name_column.lower() in col_lower or col_lower in ['nome', 'name', 'empresa', 'company']:
            name_col = col
    
    if not phone_col:
        raise HTTPException(
            status_code=400, 
            detail=f"Coluna de telefone não encontrada. Colunas disponíveis: {list(df.columns)}"
        )
    
    # Delete existing contacts for this campaign
    await db.contacts.delete_many({"campaign_id": campaign_id})
    
    # Process contacts
    contacts = []
    skipped = 0
    
    for _, row in df.iterrows():
        phone = str(row[phone_col]).strip() if pd.notna(row[phone_col]) else ""
        
        # Skip empty phones
        if not phone or phone == "nan":
            skipped += 1
            continue
        
        name = str(row[name_col]).strip() if name_col and pd.notna(row.get(name_col)) else "Sem nome"
        
        # Build extra data from other columns
        extra_data = {}
        for col in df.columns:
            if col not in [phone_col, name_col]:
                value = row[col]
                if pd.notna(value):
                    extra_data[col] = str(value)
        
        contact = Contact(
            campaign_id=campaign_id,
            name=name,
            phone=phone,
            email=extra_data.get("Email") or extra_data.get("email"),
            category=extra_data.get("Categoria") or extra_data.get("categoria") or extra_data.get("Category"),
            extra_data=extra_data
        )
        contacts.append(contact.dict())
    
    # Insert contacts
    if contacts:
        await db.contacts.insert_many(contacts)
    
    # Update campaign counts
    await db.campaigns.update_one(
        {"id": campaign_id},
        {
            "$set": {
                "total_contacts": len(contacts),
                "pending_count": len(contacts),
                "sent_count": 0,
                "error_count": 0,
                "status": CampaignStatus.READY.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "success": True,
        "total_imported": len(contacts),
        "skipped": skipped,
        "columns_found": list(df.columns),
        "phone_column_used": phone_col,
        "name_column_used": name_col
    }


@api_router.get("/campaigns/{campaign_id}/contacts")
async def get_campaign_contacts(
    campaign_id: str,
    status: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get contacts for a campaign"""
    query = {"campaign_id": campaign_id}
    
    if status:
        query["status"] = status
    
    contacts_data = await db.contacts.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.contacts.count_documents(query)
    
    return {
        "contacts": [Contact(**c) for c in contacts_data],
        "total": total,
        "limit": limit,
        "skip": skip
    }


# ========== Campaign Control ==========
@api_router.post("/campaigns/{campaign_id}/start")
async def start_campaign(
    campaign_id: str, 
    background_tasks: BackgroundTasks, 
    user_id: str = "default",
    waha_url: str = None,
    waha_api_key: str = None,
    waha_session: str = "default"
):
    """Start campaign message dispatch"""
    campaign_data = await db.campaigns.find_one({"id": campaign_id})
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    campaign = Campaign(**campaign_data)
    
    # Check if already running
    if is_campaign_running(campaign_id):
        raise HTTPException(status_code=400, detail="Campanha já está em execução")
    
    # Check if has contacts
    if campaign.total_contacts == 0:
        raise HTTPException(status_code=400, detail="Campanha não tem contatos. Faça upload primeiro.")
    
    # Check if WAHA config was provided
    if not waha_url or not waha_api_key:
        raise HTTPException(
            status_code=400, 
            detail="Configuração WAHA não fornecida. Configure em Configurações antes de iniciar."
        )
    
    # Create WAHA service with provided config
    waha = WahaService(waha_url, waha_api_key, waha_session)
    
    # Test connection
    connection = await waha.check_connection()
    if not connection.get("connected"):
        raise HTTPException(
            status_code=400, 
            detail=f"WAHA não está conectado: {connection.get('error', 'Erro desconhecido')}"
        )
    
    # Update campaign status
    await db.campaigns.update_one(
        {"id": campaign_id},
        {
            "$set": {
                "status": CampaignStatus.RUNNING.value,
                "started_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Start worker in background
    await start_campaign_worker(db, campaign_id, waha)
    
    return {"success": True, "message": "Campanha iniciada com sucesso"}


@api_router.post("/campaigns/{campaign_id}/pause")
async def pause_campaign(campaign_id: str):
    """Pause campaign"""
    campaign_data = await db.campaigns.find_one({"id": campaign_id})
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    # Stop worker
    await stop_campaign_worker(campaign_id)
    
    # Update status
    await db.campaigns.update_one(
        {"id": campaign_id},
        {
            "$set": {
                "status": CampaignStatus.PAUSED.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "message": "Campanha pausada"}


@api_router.post("/campaigns/{campaign_id}/cancel")
async def cancel_campaign(campaign_id: str):
    """Cancel campaign"""
    campaign_data = await db.campaigns.find_one({"id": campaign_id})
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    # Stop worker
    await stop_campaign_worker(campaign_id)
    
    # Update status
    await db.campaigns.update_one(
        {"id": campaign_id},
        {
            "$set": {
                "status": CampaignStatus.CANCELLED.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "message": "Campanha cancelada"}


@api_router.post("/campaigns/{campaign_id}/reset")
async def reset_campaign(campaign_id: str):
    """Reset campaign - mark all contacts as pending again"""
    campaign_data = await db.campaigns.find_one({"id": campaign_id})
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    # Stop worker if running
    await stop_campaign_worker(campaign_id)
    
    # Reset all contacts to pending
    await db.contacts.update_many(
        {"campaign_id": campaign_id},
        {
            "$set": {
                "status": ContactStatus.PENDING.value,
                "error_message": None,
                "sent_at": None
            }
        }
    )
    
    # Update campaign counts
    total = await db.contacts.count_documents({"campaign_id": campaign_id})
    
    await db.campaigns.update_one(
        {"id": campaign_id},
        {
            "$set": {
                "status": CampaignStatus.READY.value,
                "total_contacts": total,
                "pending_count": total,
                "sent_count": 0,
                "error_count": 0,
                "started_at": None,
                "completed_at": None,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Clear message logs
    await db.message_logs.delete_many({"campaign_id": campaign_id})
    
    return {"success": True, "message": "Campanha resetada"}


# ========== Message Logs ==========
@api_router.get("/campaigns/{campaign_id}/logs")
async def get_message_logs(
    campaign_id: str,
    status: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get message logs for a campaign"""
    query = {"campaign_id": campaign_id}
    
    if status:
        query["status"] = status
    
    logs_data = await db.message_logs.find(query).sort("sent_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.message_logs.count_documents(query)
    
    return {
        "logs": [MessageLog(**l) for l in logs_data],
        "total": total,
        "limit": limit,
        "skip": skip
    }


# ========== Dashboard Stats ==========
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user_id: str = "default"):
    """Get dashboard statistics"""
    # Total campaigns
    total_campaigns = await db.campaigns.count_documents({"user_id": user_id})
    
    # Active campaigns
    active_campaigns = await db.campaigns.count_documents({
        "user_id": user_id,
        "status": CampaignStatus.RUNNING.value
    })
    
    # Total messages sent (all time)
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "total": {"$sum": "$sent_count"}}}
    ]
    result = await db.campaigns.aggregate(pipeline).to_list(1)
    total_sent = result[0]["total"] if result else 0
    
    # Messages sent today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_sent = await db.message_logs.count_documents({
        "status": ContactStatus.SENT.value,
        "sent_at": {"$gte": today_start}
    })
    
    return {
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "total_messages_sent": total_sent,
        "messages_sent_today": today_sent
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
