"""
Kiwify Webhook Handler
Processa eventos de pagamento, cancelamento e reembolso
"""
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import hmac
import hashlib
import logging
from datetime import datetime, timedelta

from supabase_service import SupabaseService

logger = logging.getLogger(__name__)

webhook_router = APIRouter()

# Não instanciar db aqui - será criado dentro das funções
# db = SupabaseService()  # REMOVIDO

# Configuração Kiwify
KIWIFY_WEBHOOK_SECRET = os.environ.get('KIWIFY_WEBHOOK_SECRET', '')

# Mapeamento de produtos Kiwify para planos
PRODUCT_PLAN_MAP = {
    'PRODUCT_ID_PRO': 'Pro',           # Substitua pelo ID real do produto Pro
    'PRODUCT_ID_ENTERPRISE': 'Enterprise'  # Substitua pelo ID real do produto Enterprise
}

class KiwifyWebhookPayload(BaseModel):
    """Estrutura do webhook Kiwify"""
    event_type: str  # 'order.paid', 'order.refunded', 'subscription.canceled'
    order_id: str
    order_status: str
    product_id: str
    product_name: str
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None
    amount: float
    commission_amount: Optional[float] = None
    refunded_at: Optional[str] = None
    canceled_at: Optional[str] = None
    subscription_id: Optional[str] = None
    subscription_status: Optional[str] = None
    created_at: str


def verify_kiwify_signature(payload: bytes, signature: str) -> bool:
    """
    Verifica assinatura do webhook Kiwify
    """
    if not KIWIFY_WEBHOOK_SECRET:
        logger.warning("KIWIFY_WEBHOOK_SECRET não configurado")
        return True  # Em desenvolvimento, aceita sem verificar
    
    expected_signature = hmac.new(
        KIWIFY_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)


async def get_user_by_email(email: str) -> Optional[Dict]:
    """Busca usuário pelo email"""
    try:
        db = SupabaseService()  # Criar instância aqui
        result = await db.client.from_('profiles').select('*').eq('email', email).maybeSingle().execute()
        return result.data
    except Exception as e:
        logger.error(f"Erro ao buscar usuário por email: {e}")
        return None


async def upgrade_user_to_plan(user_id: str, plan: str, subscription_id: str, order_id: str):
    """
    Upgrade do plano do usuário
    """
    try:
        # Calcular data de expiração (30 dias)
        valid_until = (datetime.now() + timedelta(days=30)).isoformat()
        
        # Definir limites por plano
        if plan == 'Pro':
            lead_limit = -1  # Ilimitado
            campaigns_limit = -1  # Ilimitado
        elif plan == 'Enterprise':
            lead_limit = -1
            campaigns_limit = -1
        else:
            lead_limit = 5
            campaigns_limit = 0
        
        # Atualizar quota
        await db.client.from_('user_quotas').update({
            'plan': plan,
            'lead_search_limit': lead_limit,
            'campaigns_limit': campaigns_limit,
            'valid_until': valid_until,
            'subscription_id': subscription_id,
            'order_id': order_id,
            'subscription_status': 'active',
            'updated_at': datetime.now().isoformat()
        }).eq('user_id', user_id).execute()
        
        logger.info(f"✅ Usuário {user_id} atualizado para plano {plan}")
        
    except Exception as e:
        logger.error(f"Erro ao fazer upgrade: {e}")
        raise


async def downgrade_user_to_demo(user_id: str, reason: str):
    """
    Downgrade para plano Demo (cancelamento/reembolso)
    """
    try:
        await db.client.from_('user_quotas').update({
            'plan': 'Demo',
            'lead_search_limit': 5,
            'campaigns_limit': 0,
            'valid_until': None,
            'subscription_id': None,
            'subscription_status': 'canceled',
            'cancellation_reason': reason,
            'updated_at': datetime.now().isoformat()
        }).eq('user_id', user_id).execute()
        
        logger.info(f"⚠️ Usuário {user_id} rebaixado para Demo. Motivo: {reason}")
        
    except Exception as e:
        logger.error(f"Erro ao fazer downgrade: {e}")
        raise


async def log_webhook_event(event_type: str, payload: Dict[str, Any], status: str, error: Optional[str] = None):
    """
    Registra evento de webhook para auditoria
    """
    try:
        await db.client.from_('webhook_logs').insert({
            'event_type': event_type,
            'payload': payload,
            'status': status,
            'error_message': error,
            'created_at': datetime.now().isoformat()
        }).execute()
    except Exception as e:
        logger.error(f"Erro ao logar webhook: {e}")


@webhook_router.post("/webhook/kiwify")
async def kiwify_webhook(
    request: Request,
    x_kiwify_signature: Optional[str] = Header(None)
):
    """
    Endpoint para receber webhooks do Kiwify
    
    Eventos suportados:
    - order.paid: Pagamento aprovado → Upgrade
    - order.refunded: Reembolso solicitado → Downgrade
    - subscription.canceled: Assinatura cancelada → Downgrade
    """
    try:
        # Ler body raw
        body = await request.body()
        
        # Verificar assinatura
        if x_kiwify_signature and not verify_kiwify_signature(body, x_kiwify_signature):
            logger.warning("⚠️ Assinatura inválida do webhook Kiwify")
            await log_webhook_event('invalid_signature', {}, 'failed', 'Invalid signature')
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse payload
        payload_dict = await request.json()
        payload = KiwifyWebhookPayload(**payload_dict)
        
        logger.info(f"📩 Webhook recebido: {payload.event_type} - {payload.customer_email}")
        
        # Buscar usuário pelo email
        user = await get_user_by_email(payload.customer_email)
        
        if not user:
            logger.warning(f"⚠️ Usuário não encontrado: {payload.customer_email}")
            await log_webhook_event(
                payload.event_type,
                payload_dict,
                'failed',
                f'User not found: {payload.customer_email}'
            )
            return {"status": "error", "message": "User not found"}
        
        user_id = user['id']
        
        # Processar evento
        if payload.event_type == 'order.paid':
            # PAGAMENTO APROVADO - UPGRADE
            plan = PRODUCT_PLAN_MAP.get(payload.product_id, 'Pro')
            
            await upgrade_user_to_plan(
                user_id=user_id,
                plan=plan,
                subscription_id=payload.subscription_id or payload.order_id,
                order_id=payload.order_id
            )
            
            await log_webhook_event(payload.event_type, payload_dict, 'success')
            
            return {
                "status": "success",
                "message": f"User upgraded to {plan}",
                "user_id": user_id
            }
        
        elif payload.event_type == 'order.refunded':
            # REEMBOLSO - DOWNGRADE
            await downgrade_user_to_demo(
                user_id=user_id,
                reason=f'Reembolso solicitado - Order: {payload.order_id}'
            )
            
            await log_webhook_event(payload.event_type, payload_dict, 'success')
            
            return {
                "status": "success",
                "message": "User downgraded due to refund",
                "user_id": user_id
            }
        
        elif payload.event_type == 'subscription.canceled':
            # CANCELAMENTO - DOWNGRADE
            await downgrade_user_to_demo(
                user_id=user_id,
                reason=f'Assinatura cancelada - Subscription: {payload.subscription_id}'
            )
            
            await log_webhook_event(payload.event_type, payload_dict, 'success')
            
            return {
                "status": "success",
                "message": "User downgraded due to cancellation",
                "user_id": user_id
            }
        
        else:
            # Evento desconhecido
            logger.warning(f"⚠️ Evento desconhecido: {payload.event_type}")
            await log_webhook_event(payload.event_type, payload_dict, 'ignored', 'Unknown event type')
            
            return {
                "status": "ignored",
                "message": f"Unknown event type: {payload.event_type}"
            }
    
    except Exception as e:
        logger.error(f"❌ Erro ao processar webhook: {e}")
        await log_webhook_event('error', {}, 'failed', str(e))
        raise HTTPException(status_code=500, detail=str(e))


@webhook_router.get("/webhook/test")
async def test_webhook():
    """Endpoint de teste"""
    return {
        "status": "ok",
        "message": "Webhook endpoint is working",
        "secret_configured": bool(KIWIFY_WEBHOOK_SECRET)
    }
