from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks, Request, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import pandas as pd
import io
import uuid

from models import (
    Campaign, CampaignCreate, CampaignUpdate, CampaignStatus, CampaignStats, CampaignWithStats,
    Contact, ContactStatus, MessageLog, CampaignSettings, CampaignMessage
)
from waha_service import WahaService
from supabase_service import get_supabase_service, SupabaseService
from campaign_worker import (
    start_campaign_worker, stop_campaign_worker, is_campaign_running
)
from security_utils import (
    get_authenticated_user,
    require_role,
    validate_file_upload,
    sanitize_csv_value,
    handle_error,
    validate_campaign_ownership,
    validate_quota_for_action
)

# --- CORREÇÃO DO LOAD DOTENV ---
# Pega o diretório atual (backend)
CURRENT_DIR = Path(__file__).parent
# Procura o .env na pasta backend OU na pasta raiz (uma acima)
dotenv_path = CURRENT_DIR / '.env'
if not dotenv_path.exists():
    dotenv_path = CURRENT_DIR.parent / '.env'

load_dotenv(dotenv_path)
# -------------------------------

# Create the main app
app = FastAPI(title="Lead Dispatcher API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ========== Helper Functions ==========
def get_db() -> SupabaseService:
    """Get Supabase service instance"""
    return get_supabase_service()


async def get_session_name_for_company(company_id: str) -> str:
    """
    Define o nome da sessão do WhatsApp de forma segura.
    Retorna sempre uma string válida, nunca falha.
    """
    try:
        db = get_db()
        # Tenta buscar configuração legada (se existir no banco)
        config = await db.get_waha_config(company_id)
        if config and config.get("session_name"):
            return config.get("session_name")
    except Exception as e:
        # Se der erro no banco, apenas loga e usa o fallback
        logger.warning(f"Usando sessão padrão devido a erro ou config ausente: {e}")
    
    # Fallback seguro: Padrão automático para SaaS
    return f"company_{company_id}"


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


def campaign_to_response(campaign_data: dict) -> dict:
    """Convert database campaign to response format"""
    return {
        "id": campaign_data["id"],
        "user_id": campaign_data.get("user_id"),
        "company_id": campaign_data.get("company_id"),
        "name": campaign_data["name"],
        "status": campaign_data.get("status", "draft"),
        "message": {
            "type": campaign_data.get("message_type", "text"),
            "text": campaign_data.get("message_text", ""),
            "media_url": campaign_data.get("media_url"),
            "media_filename": campaign_data.get("media_filename")
        },
        "settings": {
            "interval_min": campaign_data.get("interval_min", 30),
            "interval_max": campaign_data.get("interval_max", 60),
            "start_time": campaign_data.get("start_time"),
            "end_time": campaign_data.get("end_time"),
            "daily_limit": campaign_data.get("daily_limit"),
            "working_days": campaign_data.get("working_days", [0, 1, 2, 3, 4])
        },
        "total_contacts": campaign_data.get("total_contacts", 0),
        "sent_count": campaign_data.get("sent_count", 0),
        "error_count": campaign_data.get("error_count", 0),
        "pending_count": campaign_data.get("pending_count", 0),
        "created_at": campaign_data.get("created_at"),
        "updated_at": campaign_data.get("updated_at"),
        "started_at": campaign_data.get("started_at"),
        "completed_at": campaign_data.get("completed_at")
    }


# ========== Root Endpoint ==========
@api_router.get("/")
async def root():
    return {"message": "Lead Dispatcher API", "version": "2.2.0", "mode": "SaaS Hybrid"}


# ========== WhatsApp Management (New SaaS Endpoints) ==========

@api_router.get("/whatsapp/status")
async def get_whatsapp_status(company_id: str):
    """Verifica o estado detalhado da sessão para o Painel de Gerenciamento"""
    if not company_id:
        return {"status": "DISCONNECTED", "connected": False, "error": "Company ID missing"}

    waha_url = os.getenv('WAHA_DEFAULT_URL')
    waha_key = os.getenv('WAHA_MASTER_KEY')
    
    if not waha_url:
        return {"status": "DISCONNECTED", "connected": False, "error": "Server config error"}

    session_name = await get_session_name_for_company(company_id)
    waha = WahaService(waha_url, waha_key, session_name)
    
    conn = await waha.check_connection()
    
    # Mapeamento para o Frontend saber exatamente o que exibir
    # WORKING/CONNECTED -> Painel Ativo
    # SCAN_QR_CODE -> Exibir QR Code
    # STARTING -> Exibir Loader de "Iniciando motor..."
    status_map = {
        "STOPPED": "DISCONNECTED",
        "STARTING": "STARTING",
        "SCAN_QR_CODE": "SCANNING",
        "SCANNING": "SCANNING",
        "WORKING": "CONNECTED",
        "CONNECTED": "CONNECTED",
        "FAILED": "DISCONNECTED"
    }
    
    waha_raw_status = conn.get("status", "DISCONNECTED")
    
    return {
        "status": status_map.get(waha_raw_status, "DISCONNECTED"),
        "connected": conn.get("connected", False),
        "session_name": session_name,
        "waha_raw_status": waha_raw_status
    }


@api_router.post("/whatsapp/session/start")
async def start_whatsapp_session(company_id: str):
    """Cria e Inicia o motor da sessão (sem deslogar)"""
    waha_url = os.getenv('WAHA_DEFAULT_URL')
    waha_key = os.getenv('WAHA_MASTER_KEY')
    session_name = await get_session_name_for_company(company_id)

    waha = WahaService(waha_url, waha_key, session_name)
    
    # Inicia o motor no WAHA
    result = await waha.start_session()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))

    return {"status": "STARTING", "message": "Motor em inicialização..."}

@api_router.post("/whatsapp/session/stop")
async def stop_whatsapp_session(company_id: str):
    """Apenas para o motor da sessão (mantém o login se houver)"""
    waha_url = os.getenv('WAHA_DEFAULT_URL')
    waha_key = os.getenv('WAHA_MASTER_KEY')
    session_name = await get_session_name_for_company(company_id)

    waha = WahaService(waha_url, waha_key, session_name)
    success = await waha.stop_session()
    return {"success": success}

@api_router.post("/whatsapp/session/logout")
async def logout_whatsapp_session(company_id: str):
    """Desconecta o WhatsApp e exige novo QR Code"""
    waha_url = os.getenv('WAHA_DEFAULT_URL')
    waha_key = os.getenv('WAHA_MASTER_KEY')
    session_name = await get_session_name_for_company(company_id)

    waha = WahaService(waha_url, waha_key, session_name)
    success = await waha.logout_session()
    return {"success": success}

@api_router.get("/whatsapp/qr")
async def get_whatsapp_qr(company_id: str):
    """Endpoint dedicado apenas para buscar o QR Code atual"""
    waha_url = os.getenv('WAHA_DEFAULT_URL')
    waha_key = os.getenv('WAHA_MASTER_KEY')
    session_name = await get_session_name_for_company(company_id)

    waha = WahaService(waha_url, waha_key, session_name)
    return await waha.get_qr_code()


# ========== Campaign Endpoints ==========
@api_router.post("/campaigns")
@limiter.limit("50/hour")  # Rate limit: 50 criações por hora
async def create_campaign(
    request: Request,
    campaign: CampaignCreate,
    auth_user: dict = Depends(get_authenticated_user)
):
    """Create a new campaign - com autenticação e validação de quota"""
    try:
        db = get_db()
        
        # VALIDAR QUOTA E PLANO (requer Pro ou Enterprise)
        await validate_quota_for_action(
            user_id=auth_user["user_id"],
            action="create_campaign",
            required_plan=["Pro", "Enterprise"],
            db=db
        )
        
        # USA company_id e user_id DO TOKEN (não do cliente)
        campaign_data = {
            "id": str(uuid.uuid4()),
            "company_id": auth_user["company_id"],
            "user_id": auth_user["user_id"],
            "name": campaign.name,
            "status": "draft",
            "message_type": campaign.message.type.value,
            "message_text": campaign.message.text,
            "media_url": campaign.message.media_url,
            "media_filename": campaign.message.media_filename,
            "interval_min": campaign.settings.interval_min,
            "interval_max": campaign.settings.interval_max,
            "start_time": campaign.settings.start_time,
            "end_time": campaign.settings.end_time,
            "daily_limit": campaign.settings.daily_limit,
            "working_days": campaign.settings.working_days,
            "total_contacts": 0,
            "sent_count": 0,
            "error_count": 0,
            "pending_count": 0
        }
        
        result = await db.create_campaign(campaign_data)
        
        if not result:
            raise HTTPException(status_code=500, detail="Erro ao criar campanha")
        
        # Incrementar contador de quota
        await db.increment_quota(auth_user["user_id"], "create_campaign")
        
        return campaign_to_response(result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise handle_error(e, "Erro ao criar campanha")


@api_router.get("/campaigns")
async def list_campaigns(
    request: Request,
    auth_user: dict = Depends(get_authenticated_user),
    limit: int = 50,
    skip: int = 0
):
    """List all campaigns - apenas da empresa do usuário autenticado"""
    try:
        db = get_db()
        
        # USA company_id DO TOKEN (não do query param)
        company_id = auth_user["company_id"]
        campaigns_data = await db.get_campaigns_by_company(company_id, limit, skip)
        
        campaigns_with_stats = []
        for c in campaigns_data:
            campaign_dict = campaign_to_response(c)
            campaign_dict["stats"] = calculate_campaign_stats(c).dict()
            campaign_dict["is_worker_running"] = is_campaign_running(c["id"])
            campaigns_with_stats.append(campaign_dict)
        
        return {"campaigns": campaigns_with_stats}
    
    except HTTPException:
        raise
    except Exception as e:
        raise handle_error(e, "Erro ao listar campanhas")


@api_router.get("/campaigns/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    auth_user: dict = Depends(get_authenticated_user)
):
    """Get campaign details - com validação de ownership"""
    try:
        db = get_db()
        
        # VALIDAR OWNERSHIP (previne IDOR)
        campaign_data = await validate_campaign_ownership(
            campaign_id, 
            auth_user["company_id"],
            db
        )
        
        stats = calculate_campaign_stats(campaign_data)
        
        return {
            "campaign": campaign_to_response(campaign_data),
            "stats": stats,
            "is_worker_running": is_campaign_running(campaign_id)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise handle_error(e, "Erro ao buscar campanha")


@api_router.put("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    update: CampaignUpdate,
    auth_user: dict = Depends(get_authenticated_user)
):
    """Update campaign - com validação de ownership"""
    try:
        db = get_db()
        
        # VALIDAR OWNERSHIP (previne IDOR)
        campaign_data = await validate_campaign_ownership(
            campaign_id,
            auth_user["company_id"],
            db
        )
        
        update_dict = {}
        
        if update.name is not None:
            update_dict["name"] = update.name
        
        if update.message is not None:
            update_dict["message_type"] = update.message.type.value
            update_dict["message_text"] = update.message.text
            update_dict["media_url"] = update.message.media_url
            update_dict["media_filename"] = update.message.media_filename
        
        if update.settings is not None:
            update_dict["interval_min"] = update.settings.interval_min
            update_dict["interval_max"] = update.settings.interval_max
            update_dict["start_time"] = update.settings.start_time
            update_dict["end_time"] = update.settings.end_time
            update_dict["daily_limit"] = update.settings.daily_limit
            update_dict["working_days"] = update.settings.working_days
        
        if update_dict:
            updated = await db.update_campaign(campaign_id, update_dict)
            if updated:
                return campaign_to_response(updated)
        
        return campaign_to_response(campaign_data)
    
    except HTTPException:
        raise
    except Exception as e:
        raise handle_error(e, "Erro ao atualizar campanha")


@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    auth_user: dict = Depends(get_authenticated_user)
):
    """Delete campaign - com validação de ownership"""
    try:
        db = get_db()
        
        # VALIDAR OWNERSHIP (previne IDOR)
        await validate_campaign_ownership(
            campaign_id,
            auth_user["company_id"],
            db
        )
        
        # Stop worker if running
        await stop_campaign_worker(campaign_id)
        
        # Delete contacts
        await db.delete_contacts_by_campaign(campaign_id)
        
        # Delete message logs
        await db.delete_message_logs_by_campaign(campaign_id)
        
        # Delete campaign
        result = await db.delete_campaign(campaign_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Campanha não encontrada")
        
        return {"success": True, "message": "Campanha excluída com sucesso"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise handle_error(e, "Erro ao deletar campanha")


# ========== Upload & Contacts ==========
@api_router.post("/campaigns/{campaign_id}/upload")
async def upload_contacts(
    campaign_id: str,
    file: UploadFile = File(...),
    phone_column: str = Form(default="Telefone"),
    name_column: str = Form(default="Nome")
):
    """Upload contacts from Excel/CSV file"""
    db = get_db()
    campaign_data = await db.get_campaign(campaign_id)
    
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
            except UnicodeDecodeError:
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
    await db.delete_contacts_by_campaign(campaign_id)
    
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
        
        contact = {
            "id": str(uuid.uuid4()),
            "campaign_id": campaign_id,
            "name": name,
            "phone": phone,
            "email": extra_data.get("Email") or extra_data.get("email"),
            "category": extra_data.get("Categoria") or extra_data.get("categoria") or extra_data.get("Category"),
            "extra_data": extra_data,
            "status": "pending"
        }
        contacts.append(contact)
    
    # Insert contacts
    if contacts:
        await db.create_contacts(contacts)
    
    # Update campaign counts
    await db.update_campaign(campaign_id, {
        "total_contacts": len(contacts),
        "pending_count": len(contacts),
        "sent_count": 0,
        "error_count": 0,
        "status": "ready"
    })
    
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
    db = get_db()
    
    contacts_data = await db.get_contacts_by_campaign(campaign_id, status, limit, skip)
    total = await db.count_contacts(campaign_id, status)
    
    return {
        "contacts": contacts_data,
        "total": total,
        "limit": limit,
        "skip": skip
    }


# ========== Campaign Control (UPDATED FOR SAAS) ==========
@api_router.post("/campaigns/{campaign_id}/start")
async def start_campaign(
    campaign_id: str, 
    background_tasks: BackgroundTasks, 
    company_id: str = None,
    # Parameters now optional to support backward compatibility + new env vars
    waha_url: Optional[str] = None,
    waha_api_key: Optional[str] = None,
    waha_session: Optional[str] = "default"
):
    """Start campaign message dispatch"""
    db = get_db()
    campaign_data = await db.get_campaign(campaign_id)
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    # Check if already running
    if is_campaign_running(campaign_id):
        raise HTTPException(status_code=400, detail="Campanha já está em execução")
    
    # Check if has contacts
    if campaign_data.get("total_contacts", 0) == 0:
        raise HTTPException(status_code=400, detail="Campanha não tem contatos. Faça upload primeiro.")
    
    # --- CONFIGURAÇÃO INTELIGENTE (SaaS) ---
    # 1. Prioridade: Variáveis de Ambiente (Global) > Parâmetros da Requisição (Fallback)
    final_waha_url = os.getenv('WAHA_DEFAULT_URL') or waha_url
    final_waha_key = os.getenv('WAHA_MASTER_KEY') or waha_api_key
    
    if not final_waha_url or not final_waha_key:
        raise HTTPException(
            status_code=500, 
            detail="Erro de configuração: WAHA_DEFAULT_URL não configurada no servidor."
        )
    
    # 2. Determina a Sessão Automaticamente
    # Se company_id não vier no body, pega da campanha
    target_company_id = company_id or campaign_data.get("company_id")
    if not target_company_id:
         raise HTTPException(status_code=400, detail="ID da empresa não identificado.")

    # Se o frontend mandou um session específico (legado), usa. Senão, calcula.
    if waha_session and waha_session != "default":
        final_session = waha_session
    else:
        final_session = await get_session_name_for_company(target_company_id)

    # 3. Cria serviço e Verifica Conexão
    waha = WahaService(final_waha_url, final_waha_key, final_session)
    
    connection = await waha.check_connection()
    if not connection.get("connected"):
        raise HTTPException(
            status_code=400, 
            detail="WhatsApp desconectado. Vá em Configurações e clique em 'Gerar QR Code'."
        )
    
    # Update campaign status
    await db.update_campaign(campaign_id, {
        "status": "running",
        "started_at": datetime.utcnow().isoformat()
    })
    
    # Start worker in background using the configured WAHA service
    await start_campaign_worker(db, campaign_id, waha)
    
    return {"success": True, "message": "Campanha iniciada com sucesso"}


@api_router.post("/campaigns/{campaign_id}/pause")
async def pause_campaign(campaign_id: str):
    """Pause campaign"""
    db = get_db()
    campaign_data = await db.get_campaign(campaign_id)
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    # Stop worker
    await stop_campaign_worker(campaign_id)
    
    # Update status
    await db.update_campaign(campaign_id, {"status": "paused"})
    
    return {"success": True, "message": "Campanha pausada"}


@api_router.post("/campaigns/{campaign_id}/cancel")
async def cancel_campaign(campaign_id: str):
    """Cancel campaign"""
    db = get_db()
    campaign_data = await db.get_campaign(campaign_id)
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    # Stop worker
    await stop_campaign_worker(campaign_id)
    
    # Update status
    await db.update_campaign(campaign_id, {"status": "cancelled"})
    
    return {"success": True, "message": "Campanha cancelada"}


@api_router.post("/campaigns/{campaign_id}/reset")
async def reset_campaign(campaign_id: str):
    """Reset campaign - mark all contacts as pending again"""
    db = get_db()
    campaign_data = await db.get_campaign(campaign_id)
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    # Stop worker if running
    await stop_campaign_worker(campaign_id)
    
    # Reset all contacts to pending
    await db.reset_contacts_status(campaign_id)
    
    # Update campaign counts
    total = await db.count_contacts(campaign_id)
    
    await db.update_campaign(campaign_id, {
        "status": "ready",
        "total_contacts": total,
        "pending_count": total,
        "sent_count": 0,
        "error_count": 0,
        "started_at": None,
        "completed_at": None
    })
    
    # Clear message logs
    await db.delete_message_logs_by_campaign(campaign_id)
    
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
    db = get_db()
    
    logs_data = await db.get_message_logs(campaign_id, status, limit, skip)
    total = await db.count_message_logs(campaign_id, status)
    
    return {
        "logs": logs_data,
        "total": total,
        "limit": limit,
        "skip": skip
    }


# ========== Dashboard Stats ==========
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(company_id: str = None):
    """Get dashboard statistics"""
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id é obrigatório")
    
    db = get_db()
    stats = await db.get_dashboard_stats(company_id)
    
    return stats


# ========== Notifications Endpoints ==========
@api_router.get("/notifications")
async def get_notifications(user_id: str, limit: int = 50, unread_only: bool = False):
    """Get user notifications"""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id é obrigatório")
    
    db = get_db()
    notifications = await db.get_notifications(user_id, limit, unread_only)
    
    return {"notifications": notifications}


@api_router.get("/notifications/unread-count")
async def get_unread_count(user_id: str):
    """Get unread notification count"""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id é obrigatório")
    
    db = get_db()
    count = await db.get_unread_notification_count(user_id)
    
    return {"unread_count": count}


@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    db = get_db()
    success = await db.mark_notification_read(notification_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    return {"success": True}


@api_router.put("/notifications/mark-all-read")
async def mark_all_read(user_id: str):
    """Mark all notifications as read"""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id é obrigatório")
    
    db = get_db()
    success = await db.mark_all_notifications_read(user_id)
    
    return {"success": success}


# ========== Quotas Endpoints ==========
@api_router.get("/quotas/me")
async def get_my_quota(user_id: str):
    """Get current user quota"""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id é obrigatório")
    
    db = get_db()
    quota = await db.get_user_quota(user_id)
    
    if not quota:
        raise HTTPException(status_code=404, detail="Quota não encontrada")
    
    return quota


@api_router.post("/quotas/check")
async def check_quota_endpoint(user_id: str, action: str):
    """Check if user can perform action"""
    if not user_id or not action:
        raise HTTPException(status_code=400, detail="user_id e action são obrigatórios")
    
    db = get_db()
    result = await db.check_quota(user_id, action)
    
    return result


@api_router.post("/quotas/increment")
async def increment_quota_endpoint(user_id: str, action: str, amount: int = 1):
    """Increment quota usage"""
    if not user_id or not action:
        raise HTTPException(status_code=400, detail="user_id e action são obrigatórios")
    
    db = get_db()
    success = await db.increment_quota(user_id, action, amount)
    
    return {"success": success}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)