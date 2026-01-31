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

# Usar prefixo /api para garantir roteamento correto no Kubernetes
webhook_router = APIRouter(prefix="/api")

# Não instanciar db aqui - será criado dentro das funções
# db = SupabaseService()  # REMOVIDO

# Configuração Kiwify
KIWIFY_WEBHOOK_SECRET = os.environ.get('KIWIFY_WEBHOOK_SECRET', '')

# Mapeamento de produtos Kiwify para planos
# ID do produto principal: 4a99e8f0-fee2-11f0-8736-21de1acd3b14
# O Kiwify envia o nome do plano no campo product_name
PRODUCT_ID = '4a99e8f0-fee2-11f0-8736-21de1acd3b14'

# Mapeamento por nome do plano (como aparece no Kiwify)
PLAN_NAME_MAP = {
    'básico': 'basico',
    'basico': 'basico',
    'intermediário': 'intermediario',
    'intermediario': 'intermediario',
    'avançado': 'avancado',
    'avancado': 'avancado',
}

# Configurações de limites por plano
PLAN_LIMITS = {
    'demo': {
        'name': 'Plano Demo',
        'leads_limit': 5,
        'campaigns_limit': 1,
        'messages_limit': 50,
        'expires_days': 7
    },
    'basico': {
        'name': 'Plano Básico',
        'leads_limit': -1,  # Ilimitado
        'campaigns_limit': 0,  # Sem disparador
        'messages_limit': 0,
        'expires_days': None  # Não expira
    },
    'intermediario': {
        'name': 'Plano Intermediário',
        'leads_limit': -1,
        'campaigns_limit': -1,  # Ilimitado
        'messages_limit': -1,
        'expires_days': None
    },
    'avancado': {
        'name': 'Plano Avançado',
        'leads_limit': -1,
        'campaigns_limit': -1,
        'messages_limit': -1,
        'whatsapp_instances': 5,  # Múltiplas instâncias
        'expires_days': None
    }
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
        result = db.client.table('profiles').select('*').eq('email', email).maybe_single().execute()
        return result.data
    except Exception as e:
        logger.error(f"Erro ao buscar usuário por email: {e}")
        return None


async def upgrade_user_to_plan(user_id: str, plan: str, subscription_id: str, order_id: str):
    """
    Upgrade do plano do usuário
    """
    try:
        db = SupabaseService()
        
        # Calcular data de expiração (30 dias para planos pagos)
        valid_until = (datetime.now() + timedelta(days=30)).isoformat()
        
        # Buscar configuração do plano
        plan_key = plan.lower()
        plan_config = PLAN_LIMITS.get(plan_key, PLAN_LIMITS['demo'])
        
        # Atualizar quota - usando campos corretos da tabela
        db.client.table('user_quotas').update({
            'plan_type': plan_key,
            'plan_name': plan_config['name'],
            'leads_limit': plan_config['leads_limit'],
            'campaigns_limit': plan_config['campaigns_limit'],
            'messages_limit': plan_config['messages_limit'],
            'plan_expires_at': valid_until,
            'subscription_id': subscription_id,
            'order_id': order_id,
            'subscription_status': 'active',
            'updated_at': datetime.now().isoformat()
        }).eq('user_id', user_id).execute()
        
        logger.info(f"✅ Usuário {user_id} atualizado para plano {plan_config['name']}")
        
    except Exception as e:
        logger.error(f"Erro ao fazer upgrade: {e}")
        raise


async def downgrade_user_to_demo(user_id: str, reason: str):
    """
    Downgrade para plano Demo (cancelamento/reembolso)
    """
    try:
        db = SupabaseService()
        
        # Usar configuração do plano Demo
        demo_config = PLAN_LIMITS['demo']
        
        db.client.table('user_quotas').update({
            'plan_type': 'demo',
            'plan_name': demo_config['name'],
            'leads_limit': demo_config['leads_limit'],
            'campaigns_limit': demo_config['campaigns_limit'],
            'messages_limit': demo_config['messages_limit'],
            'plan_expires_at': (datetime.now() + timedelta(days=7)).isoformat(),
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
        db = SupabaseService()  # Criar instância aqui
        
        db.client.table('webhook_logs').insert({
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
