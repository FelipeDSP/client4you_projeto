import httpx
import logging
import base64
from typing import Optional, Dict, Any
import re
from security_utils import validate_media_url, sanitize_template_value

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    """Normalize phone number to WhatsApp format (only digits with country code)"""
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # If starts with 0, remove it
    if digits.startswith('0'):
        digits = digits[1:]
    
    # Add Brazil country code if not present
    if not digits.startswith('55'):
        digits = '55' + digits
    
    return digits


class WahaService:
    def __init__(self, waha_url: str, api_key: str, session_name: str = "default"):
        self.waha_url = waha_url.rstrip('/')
        self.api_key = api_key
        self.session_name = session_name
        self.headers = {
            "Content-Type": "application/json",
            "X-Api-Key": api_key
        }
    
# --- MÉTODOS DE SESSÃO (SAAS ROBUSTO) ---

    async def start_session(self) -> Dict[str, Any]:
        """Inicia (ou cria) a sessão no WAHA"""
        try:
            payload = {"name": self.session_name, "config": {"webhooks": []}}
            async with httpx.AsyncClient(timeout=30.0) as client:
                # 1. Tenta criar a sessão no servidor
                response = await client.post(
                    f"{self.waha_url}/api/sessions",
                    headers=self.headers,
                    json=payload
                )
                
                # Se 201 (Criado) ou 409 (Já existe), enviamos o comando START
                if response.status_code in [201, 409]:
                    await client.post(
                        f"{self.waha_url}/api/sessions/{self.session_name}/start",
                        headers=self.headers
                    )
                    return {"success": True, "status": "STARTING"}
                
                return {"success": False, "error": f"Erro WAHA: {response.status_code}"}
        except Exception as e:
            logger.error(f"Erro ao iniciar sessão: {e}")
            return {"success": False, "error": str(e)}

    async def stop_session(self) -> Dict[str, Any]:
        """Para a sessão sem desconectar (apenas desliga o motor)"""
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    f"{self.waha_url}/api/sessions/{self.session_name}/stop",
                    headers=self.headers
                )
                return {"success": response.status_code == 200}
        except Exception as e:
            logger.error(f"Erro ao parar sessão: {e}")
            return {"success": False, "error": str(e)}

    async def logout_session(self) -> Dict[str, Any]:
        """Desconecta totalmente (exige novo QR Code depois)"""
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    f"{self.waha_url}/api/sessions/{self.session_name}/logout",
                    headers=self.headers
                )
                return {"success": response.status_code == 200}
        except Exception as e:
            logger.error(f"Erro ao deslogar sessão: {e}")
            return {"success": False, "error": str(e)}

    async def get_qr_code(self) -> Dict[str, Any]:
        """Obtém a imagem do QR Code em Base64 com logs de diagnóstico"""
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                # WAHA usa /api/screenshot para capturar o QR Code
                response = await client.get(
                    f"{self.waha_url}/api/screenshot?session={self.session_name}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    # Verifica se é uma imagem PNG válida
                    if response.content[:4] == b'\x89PNG':
                        b64_img = base64.b64encode(response.content).decode('utf-8')
                        return {
                            "success": True, 
                            "image": f"data:image/png;base64,{b64_img}"
                        }
                    else:
                        logger.warning(f"Screenshot não retornou uma imagem PNG válida")
                        return {"success": False, "error": "Screenshot inválido"}
                
                # Log de diagnóstico: ajuda a identificar se o WAHA ainda não gerou o arquivo
                logger.warning(f"WAHA QR indisponível: Status {response.status_code} para sessão {self.session_name}")
                
                if response.status_code == 404:
                    return {"success": False, "error": "Sessão não encontrada ou motor ainda iniciando."}
                
                return {"success": False, "error": f"QR Code pendente (Status {response.status_code})"}
                
        except Exception as e:
            logger.error(f"Erro ao buscar QR Code: {str(e)}")
            return {"success": False, "error": str(e)}

    # --- MÉTODOS DE OPERAÇÃO (DISPARO) ---

    async def check_connection(self) -> Dict[str, Any]:
        """Check if WAHA is connected and session is active"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.waha_url}/api/sessions/{self.session_name}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        # O status crucial é "WORKING"
                        status = data.get("status", "unknown")
                        # WORKING = Conectado e pronto
                        # CONNECTED = Conectado mas talvez sincronizando
                        is_connected = status == "WORKING" or status == "CONNECTED"
                        
                        return {
                            "connected": is_connected,
                            "status": status,
                            "name": data.get("name", self.session_name),
                            "me": data.get("me", {})
                        }
                    except:
                        return {"connected": False, "status": "error_parsing"}
                elif response.status_code == 404:
                    return {
                        "connected": False,
                        "status": "session_not_found",
                        "error": "Sessão não encontrada."
                    }
                else:
                    return {
                        "connected": False,
                        "status": "error",
                        "error": f"Erro HTTP {response.status_code}"
                    }
        except Exception as e:
            logger.error(f"Error checking WAHA connection: {e}")
            return {"connected": False, "status": "error", "error": str(e)}
    
    async def send_text_message(self, phone: str, message: str) -> Dict[str, Any]:
        """Send a text message via WAHA"""
        chat_id = f"{normalize_phone(phone)}@c.us"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.waha_url}/api/sendText",
                    headers=self.headers,
                    json={
                        "chatId": chat_id,
                        "text": message,
                        "session": self.session_name
                    }
                )
                
                if response.status_code in [200, 201]:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            logger.error(f"Error sending text message: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_image_message(
        self, 
        phone: str, 
        caption: str,
        image_url: Optional[str] = None,
        image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send an image message via WAHA"""
        chat_id = f"{normalize_phone(phone)}@c.us"
        
        try:
            payload = {
                "chatId": chat_id,
                "caption": caption,
                "session": self.session_name
            }
            
            if image_url:
                # VALIDAR URL PARA PREVENIR SSRF
                is_valid, error_msg = validate_media_url(image_url)
                if not is_valid:
                    logger.warning(f"Invalid/blocked image URL: {image_url} - {error_msg}")
                    return {"success": False, "error": f"URL inválida: {error_msg}"}
                
                payload["file"] = {"url": image_url}
            elif image_base64:
                payload["file"] = {"data": image_base64}
            else:
                return {"success": False, "error": "No image provided"}
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.waha_url}/api/sendImage",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code in [200, 201]:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            logger.error(f"Error sending image message: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_document_message(
        self,
        phone: str,
        caption: str,
        document_url: Optional[str] = None,
        document_base64: Optional[str] = None,
        filename: str = "document"
    ) -> Dict[str, Any]:
        """Send a document message via WAHA"""
        chat_id = f"{normalize_phone(phone)}@c.us"
        
        try:
            payload = {
                "chatId": chat_id,
                "caption": caption,
                "session": self.session_name,
                "file": {
                    "filename": filename
                }
            }
            
            if document_url:
                # VALIDAR URL PARA PREVENIR SSRF
                is_valid, error_msg = validate_media_url(document_url)
                if not is_valid:
                    logger.warning(f"Invalid/blocked document URL: {document_url} - {error_msg}")
                    return {"success": False, "error": f"URL inválida: {error_msg}"}
                
                payload["file"]["url"] = document_url
            elif document_base64:
                payload["file"]["data"] = document_base64
            else:
                return {"success": False, "error": "No document provided"}
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.waha_url}/api/sendFile",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code in [200, 201]:
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            logger.error(f"Error sending document message: {e}")
            return {"success": False, "error": str(e)}


def replace_variables(template: str, data: Dict[str, Any]) -> str:
    """
    Replace variables in message template with sanitized values.
    Previne command injection e XSS.
    """
    result = template
    
    # Replace {variable} patterns com valores sanitizados
    for key, value in data.items():
        # SANITIZAR VALOR ANTES DE SUBSTITUIR
        safe_value = sanitize_template_value(value)
        
        placeholder = "{" + key + "}"
        result = result.replace(placeholder, safe_value)
    
    # Also support {Nome}, {nome}, {NOME} variations
    for key, value in data.items():
        safe_value = sanitize_template_value(value)
        
        for variant in [key.lower(), key.upper(), key.capitalize()]:
            placeholder = "{" + variant + "}"
            result = result.replace(placeholder, safe_value)
    
    return result