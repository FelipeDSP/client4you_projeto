"""
Admin endpoints - Gerenciamento de usuários
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import logging
from security_utils import get_authenticated_user, require_role
from supabase_service import get_supabase_service

logger = logging.getLogger(__name__)

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])


class DeleteUserRequest(BaseModel):
    user_id: str


@admin_router.delete("/users/{user_id}")
async def delete_user_completely(
    user_id: str,
    auth_user: dict = Depends(require_role("super_admin"))
):
    """
    Deleta completamente um usuário do sistema
    - Remove de auth.users (Supabase Auth)
    - Remove de profiles
    - Remove de user_roles
    - Remove de user_quotas
    - Remove todas as dependências
    
    IMPORTANTE: Requer role super_admin
    """
    try:
        # Prevenir auto-deleção
        if user_id == auth_user["user_id"]:
            raise HTTPException(
                status_code=400,
                detail="Você não pode deletar sua própria conta de admin"
            )
        
        db = get_supabase_service()
        
        # 1. Buscar dados do usuário antes de deletar
        user_profile = db.client.table('profiles')\
            .select('email, company_id')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not user_profile.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        user_email = user_profile.data.get('email')
        company_id = user_profile.data.get('company_id')
        
        logger.info(f"Admin {auth_user['email']} iniciando deleção de usuário {user_email} (ID: {user_id})")
        
        # 2. Deletar user_quotas
        try:
            db.client.table('user_quotas').delete().eq('user_id', user_id).execute()
            logger.info(f"✅ user_quotas deletado para {user_id}")
        except Exception as e:
            logger.warning(f"Erro ao deletar user_quotas: {e}")
        
        # 3. Deletar user_roles
        try:
            db.client.table('user_roles').delete().eq('user_id', user_id).execute()
            logger.info(f"✅ user_roles deletado para {user_id}")
        except Exception as e:
            logger.warning(f"Erro ao deletar user_roles: {e}")
        
        # 4. Deletar campanhas do usuário (se houver)
        try:
            campaigns = db.client.table('campaigns')\
                .select('id')\
                .eq('user_id', user_id)\
                .execute()
            
            if campaigns.data:
                for campaign in campaigns.data:
                    # Deletar contatos e logs da campanha
                    db.client.table('campaign_contacts')\
                        .delete()\
                        .eq('campaign_id', campaign['id'])\
                        .execute()
                    db.client.table('message_logs')\
                        .delete()\
                        .eq('campaign_id', campaign['id'])\
                        .execute()
                
                # Deletar campanhas
                db.client.table('campaigns').delete().eq('user_id', user_id).execute()
                logger.info(f"✅ Campanhas deletadas para {user_id}")
        except Exception as e:
            logger.warning(f"Erro ao deletar campanhas: {e}")
        
        # 5. Deletar leads do usuário
        try:
            db.client.table('leads').delete().eq('user_id', user_id).execute()
            logger.info(f"✅ Leads deletados para {user_id}")
        except Exception as e:
            logger.warning(f"Erro ao deletar leads: {e}")
        
        # 6. Deletar histórico de busca
        try:
            db.client.table('search_history').delete().eq('user_id', user_id).execute()
            logger.info(f"✅ Histórico de busca deletado para {user_id}")
        except Exception as e:
            logger.warning(f"Erro ao deletar search_history: {e}")
        
        # 7. Deletar notificações
        try:
            db.client.table('notifications').delete().eq('user_id', user_id).execute()
            logger.info(f"✅ Notificações deletadas para {user_id}")
        except Exception as e:
            logger.warning(f"Erro ao deletar notificações: {e}")
        
        # 8. Deletar profile
        db.client.table('profiles').delete().eq('id', user_id).execute()
        logger.info(f"✅ Profile deletado para {user_id}")
        
        # 9. CRÍTICO: Deletar da tabela auth.users usando admin API
        try:
            # Usar service_role para deletar usuário do Auth
            response = db.client.auth.admin.delete_user(user_id)
            logger.info(f"✅ Usuário deletado do Supabase Auth: {user_id}")
        except Exception as e:
            logger.error(f"❌ ERRO CRÍTICO: Falha ao deletar do auth.users: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Usuário deletado das tabelas mas falhou em auth.users: {str(e)}"
            )
        
        logger.info(f"✅ DELEÇÃO COMPLETA: Usuário {user_email} (ID: {user_id}) totalmente removido")
        
        return {
            "success": True,
            "message": f"Usuário {user_email} deletado completamente do sistema",
            "user_id": user_id,
            "email": user_email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao deletar usuário {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao deletar usuário: {str(e)}"
        )
