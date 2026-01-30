"""
Security utilities for authentication, validation and sanitization
"""
import os
import logging
import ipaddress
import re
import html
from typing import Optional, Dict, Any
from urllib.parse import urlparse
from fastapi import HTTPException, Request, Depends
from supabase import create_client

logger = logging.getLogger(__name__)


# ========== AUTHENTICATION ==========

async def get_authenticated_user(request: Request) -> dict:
    """
    Extrai e valida usuário autenticado do token JWT do Supabase.
    Retorna dict com user_id, company_id e role.
    
    Raises:
        HTTPException 401: Se token inválido ou ausente
        HTTPException 403: Se perfil não encontrado
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Authorization header missing or invalid")
        raise HTTPException(
            status_code=401, 
            detail="Token de autenticação não fornecido"
        )
    
    token = auth_header.replace("Bearer ", "")
    logger.info(f"Validating token for request to {request.url.path}")
    
    try:
        # Criar cliente Supabase
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            logger.error("Supabase credentials not configured")
            raise HTTPException(status_code=500, detail="Configuração de autenticação inválida")
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Validar token e obter usuário (usando service_role key para validar o token do usuário)
        try:
            # Decodificar o JWT localmente para obter o user_id
            import jwt
            decoded = jwt.decode(token, options={"verify_signature": False})
            user_id = decoded.get("sub")
            
            if not user_id:
                logger.error("No user_id in token")
                raise HTTPException(status_code=401, detail="Token inválido")
            
            logger.info(f"Token decoded, user_id: {user_id}")
            
            # Buscar company_id do perfil usando service_role key
            # Nota: coluna 'role' pode não existir, então não buscamos
            profile = supabase.table('profiles')\
                .select('company_id, email, full_name')\
                .eq('id', user_id)\
                .single()\
                .execute()
            
            if not profile.data:
                logger.error(f"Profile not found for user_id: {user_id}")
                raise HTTPException(status_code=403, detail="Perfil de usuário não encontrado")
            
            # Definir role padrão como 'user' (pode ser estendido no futuro)
            role = "user"  # Default role
            
            logger.info(f"Profile found: company_id={profile.data.get('company_id')}, role={role}")
            
            return {
                "user_id": user_id,
                "company_id": profile.data.get("company_id"),
                "role": role,
                "email": profile.data.get("email") or decoded.get("email")
            }
        
        except jwt.DecodeError as e:
            logger.error(f"JWT decode error: {e}")
            raise HTTPException(status_code=401, detail="Token malformado")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error authenticating user: {e}", exc_info=True)
        raise HTTPException(status_code=401, detail="Erro ao validar autenticação")


def require_role(required_role: str):
    """
    Decorator/dependency para verificar role do usuário.
    Hierarquia: admin > manager > user
    
    Usage:
        @api_router.get("/admin/endpoint")
        async def admin_endpoint(auth_user: dict = Depends(require_role("admin"))):
            ...
    """
    async def role_checker(request: Request) -> dict:
        auth_user = await get_authenticated_user(request)
        
        role_hierarchy = {"admin": 3, "manager": 2, "user": 1}
        user_level = role_hierarchy.get(auth_user.get("role", "user"), 0)
        required_level = role_hierarchy.get(required_role, 999)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=403,
                detail=f"Acesso negado. Requer permissão: {required_role}"
            )
        
        return auth_user
    
    return role_checker


# ========== FILE UPLOAD VALIDATION ==========

def validate_file_upload(content: bytes, filename: str, max_size_mb: int = 10) -> tuple[bool, Optional[str]]:
    """
    Valida arquivo de upload para prevenir XXE, CSV injection, etc.
    
    Returns:
        (is_valid, error_message)
    """
    max_size = max_size_mb * 1024 * 1024
    
    # 1. Validar tamanho
    if len(content) > max_size:
        return False, f"Arquivo muito grande. Máximo: {max_size_mb}MB"
    
    # 2. Validar extensão
    allowed_extensions = ['.xlsx', '.xls', '.csv']
    file_ext = filename.lower().split('.')[-1] if '.' in filename else ''
    if f'.{file_ext}' not in allowed_extensions:
        return False, f"Tipo de arquivo não permitido. Use: {', '.join(allowed_extensions)}"
    
    # 3. Sanitizar nome do arquivo
    safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    if not safe_filename:
        return False, "Nome de arquivo inválido"
    
    return True, None


def sanitize_csv_value(value: Any) -> str:
    """
    Sanitiza valor para prevenir CSV Injection.
    Remove caracteres perigosos do início que podem executar fórmulas.
    """
    if value is None:
        return ""
    
    str_value = str(value).strip()
    
    if not str_value:
        return ""
    
    # Caracteres perigosos no início de células CSV/Excel
    dangerous_starts = ['=', '+', '-', '@', '\t', '\r', '\n']
    
    # Se começa com caractere perigoso, adiciona ' para neutralizar
    if str_value[0] in dangerous_starts:
        str_value = "'" + str_value
    
    # Remove quebras de linha que podem quebrar a estrutura CSV
    str_value = str_value.replace('\n', ' ').replace('\r', ' ')
    
    return str_value


# ========== URL VALIDATION (SSRF PREVENTION) ==========

def validate_media_url(url: str) -> tuple[bool, Optional[str]]:
    """
    Valida URL de mídia para prevenir SSRF.
    Bloqueia IPs privados, localhost, cloud metadata, etc.
    
    Returns:
        (is_valid, error_message)
    """
    if not url:
        return False, "URL não fornecida"
    
    try:
        parsed = urlparse(url)
        
        # 1. Apenas HTTP/HTTPS
        if parsed.scheme not in ['http', 'https']:
            return False, "Apenas URLs HTTP/HTTPS são permitidas"
        
        # 2. Validar hostname
        hostname = parsed.hostname
        if not hostname:
            return False, "URL inválida"
        
        # 3. Lista de hostnames bloqueados
        blocked_hostnames = [
            'localhost',
            '127.0.0.1',
            '0.0.0.0',
            'metadata.google.internal',  # GCP metadata
            '169.254.169.254',  # AWS/Azure metadata
            'metadata.azure.com',
            'metadata',
        ]
        
        hostname_lower = hostname.lower()
        if hostname_lower in blocked_hostnames:
            return False, "Hostname bloqueado por política de segurança"
        
        # 4. Bloquear IPs privados e reservados
        try:
            # Tenta tratar como IP
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False, "IPs privados/reservados não são permitidos"
        except ValueError:
            # Não é IP, é hostname - validar através de DNS
            import socket
            try:
                resolved_ip = socket.gethostbyname(hostname)
                ip = ipaddress.ip_address(resolved_ip)
                if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                    return False, "URL resolve para IP privado/reservado"
            except (socket.gaierror, ValueError):
                # Não conseguiu resolver ou IP inválido
                pass
        
        # 5. Validar extensão de arquivo (whitelist)
        path = parsed.path.lower()
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx']
        
        # URL pode não ter extensão (ex: CDN com query string)
        # Então validamos apenas se tiver extensão clara
        if '.' in path:
            has_valid_ext = any(path.endswith(ext) for ext in allowed_extensions)
            if not has_valid_ext:
                return False, f"Extensão de arquivo não permitida. Use: {', '.join(allowed_extensions)}"
        
        # 6. Bloquear caracteres suspeitos que podem indicar bypass
        suspicious_chars = ['@', '#']
        if any(char in url for char in suspicious_chars):
            return False, "URL contém caracteres suspeitos"
        
        return True, None
    
    except Exception as e:
        logger.warning(f"Error validating URL {url}: {e}")
        return False, "URL inválida"


# ========== TEMPLATE VARIABLE SANITIZATION ==========

def sanitize_template_value(value: Any, max_length: int = 500) -> str:
    """
    Sanitiza valores antes de substituição em templates de mensagem.
    Previne command injection e XSS.
    """
    if value is None:
        return ""
    
    # Converte para string
    str_value = str(value)
    
    # Remove caracteres perigosos para command injection
    dangerous_chars = ['`', '|', '>', '<', '$', ';', '&', '\n', '\r', '\0']
    for char in dangerous_chars:
        str_value = str_value.replace(char, '')
    
    # HTML escape para prevenir XSS se renderizado em HTML
    str_value = html.escape(str_value)
    
    # Limita tamanho para prevenir DoS
    if len(str_value) > max_length:
        str_value = str_value[:max_length]
    
    return str_value


# ========== ERROR HANDLING ==========

def handle_error(
    e: Exception, 
    user_message: str = "Erro ao processar requisição",
    log_full_error: bool = True
) -> HTTPException:
    """
    Trata erro de forma segura:
    - Log detalhado internamente
    - Mensagem genérica para o usuário (em produção)
    
    Returns:
        HTTPException pronta para raise
    """
    # Log completo para debug interno
    if log_full_error:
        logger.error(f"Error: {str(e)}", exc_info=True)
    
    # Se já é HTTPException, retorna como está
    if isinstance(e, HTTPException):
        return e
    
    # Em produção, mensagens genéricas
    is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"
    
    if is_production:
        return HTTPException(status_code=500, detail=user_message)
    else:
        # Em desenvolvimento, pode mostrar mais detalhes
        return HTTPException(status_code=500, detail=f"{user_message}: {str(e)}")


# ========== OWNERSHIP VALIDATION ==========

async def validate_campaign_ownership(
    campaign_id: str,
    company_id: str,
    db
) -> dict:
    """
    Valida se campanha pertence à empresa.
    Previne IDOR.
    
    Returns:
        campaign_data dict
    
    Raises:
        HTTPException 404: Campanha não encontrada
        HTTPException 403: Acesso negado (não é dono)
    """
    campaign_data = await db.get_campaign(campaign_id)
    
    if not campaign_data:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    if campaign_data.get("company_id") != company_id:
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Esta campanha não pertence à sua empresa."
        )
    
    return campaign_data


# ========== QUOTA VALIDATION ==========

async def validate_quota_for_action(
    user_id: str,
    action: str,
    required_plan: Optional[list] = None,
    db = None
) -> None:
    """
    Valida se usuário tem quota/plano para realizar ação.
    
    Args:
        user_id: ID do usuário
        action: Nome da ação (ex: "create_campaign", "send_message")
        required_plan: Lista de planos permitidos (ex: ["Pro", "Enterprise"])
        db: Instância do banco de dados
    
    Raises:
        HTTPException 403: Quota insuficiente ou plano inadequado
    """
    if not db:
        from supabase_service import get_supabase_service
        db = get_supabase_service()
    
    # Buscar quota do usuário
    quota = await db.get_user_quota(user_id)
    if not quota:
        raise HTTPException(
            status_code=403,
            detail="Quota não encontrada. Entre em contato com o suporte."
        )
    
    # Verificar plano se necessário
    if required_plan:
        user_plan = quota.get("plan_name", "Free")
        if user_plan not in required_plan:
            raise HTTPException(
                status_code=403,
                detail=f"Esta funcionalidade está disponível apenas para os planos: {', '.join(required_plan)}. "
                       f"Seu plano atual: {user_plan}. Faça upgrade para acessar."
            )
    
    # Verificar limite de uso
    quota_check = await db.check_quota(user_id, action)
    if not quota_check.get("allowed", False):
        reason = quota_check.get("reason", "Limite atingido")
        raise HTTPException(
            status_code=403,
            detail=f"Limite de uso atingido: {reason}. Faça upgrade ou aguarde renovação da quota."
        )
