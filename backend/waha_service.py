import httpx
import logging
from typing import Optional, Dict, Any
import re

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
                        return {
                            "connected": True,
                            "status": data.get("status", "unknown"),
                            "name": data.get("name", self.session_name),
                            "me": data.get("me", {})
                        }
                    except:
                        return {
                            "connected": True,
                            "status": "connected",
                            "name": self.session_name
                        }
                elif response.status_code == 404:
                    return {
                        "connected": False,
                        "status": "session_not_found",
                        "error": "Sessão não encontrada. Verifique o nome da sessão."
                    }
                else:
                    error_text = ""
                    try:
                        error_data = response.json()
                        error_text = error_data.get("message", "")
                    except:
                        error_text = response.text[:100] if response.text else ""
                    
                    return {
                        "connected": False,
                        "status": "error",
                        "error": f"Erro HTTP {response.status_code}: {error_text}"
                    }
        except httpx.ConnectError:
            return {
                "connected": False,
                "status": "connection_error",
                "error": "Não foi possível conectar ao WAHA. Verifique a URL."
            }
        except httpx.TimeoutException:
            return {
                "connected": False,
                "status": "timeout",
                "error": "Tempo limite excedido ao conectar ao WAHA."
            }
        except Exception as e:
            logger.error(f"Error checking WAHA connection: {e}")
            return {
                "connected": False,
                "status": "error",
                "error": f"Erro: {str(e)}"
            }
    
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
                
                logger.info(f"WAHA sendText response: {response.status_code} - {response.text[:200] if response.text else 'empty'}")
                
                if response.status_code == 200 or response.status_code == 201:
                    try:
                        return {
                            "success": True,
                            "data": response.json()
                        }
                    except:
                        return {
                            "success": True,
                            "data": {"status": "sent"}
                        }
                else:
                    error_msg = f"HTTP {response.status_code}"
                    try:
                        error_data = response.json()
                        error_msg = error_data.get("message", error_msg)
                    except:
                        if response.text:
                            error_msg = f"{error_msg}: {response.text[:100]}"
                    return {
                        "success": False,
                        "error": error_msg
                    }
        except httpx.ConnectError:
            return {
                "success": False,
                "error": "Não foi possível conectar ao WAHA"
            }
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "Tempo limite excedido"
            }
        except Exception as e:
            logger.error(f"Error sending text message: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
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
                
                if response.status_code == 200 or response.status_code == 201:
                    return {
                        "success": True,
                        "data": response.json()
                    }
                else:
                    error_data = response.json() if response.text else {}
                    return {
                        "success": False,
                        "error": error_data.get("message", f"HTTP {response.status_code}")
                    }
        except Exception as e:
            logger.error(f"Error sending image message: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
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
                
                if response.status_code == 200 or response.status_code == 201:
                    return {
                        "success": True,
                        "data": response.json()
                    }
                else:
                    error_data = response.json() if response.text else {}
                    return {
                        "success": False,
                        "error": error_data.get("message", f"HTTP {response.status_code}")
                    }
        except Exception as e:
            logger.error(f"Error sending document message: {e}")
            return {
                "success": False,
                "error": str(e)
            }


def replace_variables(template: str, data: Dict[str, Any]) -> str:
    """Replace variables in message template with actual values"""
    result = template
    
    # Replace {variable} patterns
    for key, value in data.items():
        placeholder = "{" + key + "}"
        result = result.replace(placeholder, str(value) if value else "")
    
    # Also support {Nome}, {nome}, {NOME} variations
    for key, value in data.items():
        for variant in [key.lower(), key.upper(), key.capitalize()]:
            placeholder = "{" + variant + "}"
            result = result.replace(placeholder, str(value) if value else "")
    
    return result
