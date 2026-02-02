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


class CleanupOrphansResponse(BaseModel):
    orphans_found: int
    orphans_deleted: int
    orphan_emails: list[str]


@admin_router.get("/orphan-users")
async def get_orphan_users(
    auth_user: dict = Depends(require_role("super_admin"))
):
    """
    Lista usuários órfãos (existem em auth.users mas não em profiles)
    
    IMPORTANTE: Requer role super_admin
    """
    try:
        db = get_supabase_service()
        
        # Buscar todos os usuários do Auth
        auth_response = db.client.auth.admin.list_users()
        auth_users = auth_response if isinstance(auth_response, list) else []
        
        # Buscar todos os IDs de profiles
        profiles_result = db.client.table('profiles').select('id').execute()
        profile_ids = set([p['id'] for p in profiles_result.data]) if profiles_result.data else set()
        
        # Encontrar órfãos
        orphans = []
        for user in auth_users:
            user_id = user.id if hasattr(user, 'id') else user.get('id')
            email = user.email if hasattr(user, 'email') else user.get('email')
            created_at = user.created_at if hasattr(user, 'created_at') else user.get('created_at')
            
            if user_id not in profile_ids:
                orphans.append({
                    'id': user_id,
                    'email': email,
                    'created_at': created_at
                })
        
        logger.info(f"Admin {auth_user['email']} listou {len(orphans)} usuários órfãos")
        
        return {
            'total_auth_users': len(auth_users),
            'total_profiles': len(profile_ids),
            'orphans_found': len(orphans),
            'orphans': orphans
        }
        
    except Exception as e:
        logger.error(f"Erro ao listar usuários órfãos: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar órfãos: {str(e)}")


@admin_router.delete("/orphan-users")
async def cleanup_orphan_users(
    auth_user: dict = Depends(require_role("super_admin"))
):
    """
    Remove todos os usuários órfãos (existem em auth.users mas não em profiles)
    
    ATENÇÃO: Ação irreversível!
    IMPORTANTE: Requer role super_admin
    """
    try:
        db = get_supabase_service()
        
        # Buscar órfãos (mesmo código do endpoint GET)
        auth_response = db.client.auth.admin.list_users()
        auth_users = auth_response if isinstance(auth_response, list) else []
        
        profiles_result = db.client.table('profiles').select('id').execute()
        profile_ids = set([p['id'] for p in profiles_result.data]) if profiles_result.data else set()
        
        orphans = []
        for user in auth_users:
            user_id = user.id if hasattr(user, 'id') else user.get('id')
            email = user.email if hasattr(user, 'email') else user.get('email')
            
            if user_id not in profile_ids:
                orphans.append({'id': user_id, 'email': email})
        
        if not orphans:
            return {
                'success': True,
                'message': 'Nenhum usuário órfão encontrado',
                'orphans_deleted': 0,
                'orphan_emails': []
            }
        
        # Deletar órfãos
        deleted_count = 0
        deleted_emails = []
        failed = []
        
        for orphan in orphans:
            try:
                db.client.auth.admin.delete_user(orphan['id'])
                deleted_count += 1
                deleted_emails.append(orphan['email'])
                logger.info(f"✅ Órfão deletado: {orphan['email']} (ID: {orphan['id']})")
            except Exception as e:
                failed.append({'email': orphan['email'], 'error': str(e)})
                logger.error(f"❌ Erro ao deletar órfão {orphan['email']}: {e}")
        
        logger.warning(f"Admin {auth_user['email']} deletou {deleted_count} usuários órfãos")
        
        return {
            'success': True,
            'message': f'{deleted_count} usuário(s) órfão(s) deletado(s)',
            'orphans_found': len(orphans),
            'orphans_deleted': deleted_count,
            'orphan_emails': deleted_emails,
            'failed': failed if failed else None
        }
        
    except Exception as e:
        logger.error(f"Erro ao limpar usuários órfãos: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na limpeza: {str(e)}")


class UpdateQuotaRequest(BaseModel):
    plan_type: str
    plan_name: str
    leads_limit: int
    campaigns_limit: int
    messages_limit: int


@admin_router.post("/users/{user_id}/quota")
async def update_user_quota(
    user_id: str,
    quota_data: UpdateQuotaRequest,
    auth_user: dict = Depends(require_role("super_admin"))
):
    """
    Atualiza quota de um usuário (admin only)
    
    IMPORTANTE: Requer role super_admin
    """
    try:
        db = get_supabase_service()
        
        # Buscar user_id para pegar company_id
        profile = db.client.table('profiles')\
            .select('company_id')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not profile.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        company_id = profile.data.get('company_id')
        
        # Upsert quota
        quota_data = {
            'user_id': user_id,
            'company_id': company_id,
            'plan_type': plan_type,
            'plan_name': plan_name,
            'leads_limit': leads_limit,
            'campaigns_limit': campaigns_limit,
            'messages_limit': messages_limit,
            'subscription_status': 'active'
        }
        
        result = db.client.table('user_quotas')\
            .upsert(quota_data, on_conflict='user_id')\
            .execute()
        
        logger.info(f"Admin {auth_user['email']} atualizou quota de {user_id} para {plan_type}")
        
        return {
            'success': True,
            'message': 'Quota atualizada com sucesso',
            'quota': result.data[0] if result.data else quota_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar quota: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar quota: {str(e)}")


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
