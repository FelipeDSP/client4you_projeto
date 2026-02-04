"""
Serviço de busca de leads usando SERP API
"""
import requests
import hashlib
from typing import List, Dict, Any, Optional
from supabase_service import SupabaseService
import logging

logger = logging.getLogger(__name__)


def generate_fingerprint(name: str, address: str, phone: str) -> str:
    """Gera fingerprint único para um lead"""
    data = f"{(name or '').lower().strip()}|{(address or '').lower().strip()}|{(phone or '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')}"
    return hashlib.md5(data.encode()).hexdigest()


def normalize_phone(phone: str) -> str:
    """Normaliza telefone para padrão brasileiro"""
    digits = ''.join(filter(str.isdigit, phone))
    if digits.startswith('55'):
        return digits
    if digits.startswith('0'):
        return '55' + digits[1:]
    return '55' + digits


async def search_leads_serp(
    query: str,
    location: str,
    company_id: str,
    serpapi_key: str,
    supabase: SupabaseService,
    start: int = 0
) -> Dict[str, Any]:
    """
    Busca leads usando SERP API e salva no banco
    
    Returns:
        Dict com results, new_count, duplicate_count, has_more
    """
    try:
        # Montar query
        search_query = f"{query} em {location}" if location else query
        
        # Chamar SERP API
        serp_url = f"https://serpapi.com/search.json"
        params = {
            'engine': 'google_maps',
            'q': search_query,
            'api_key': serpapi_key,
            'hl': 'pt-br',
            'gl': 'br',
            'start': start
        }
        
        logger.info(f"Searching SERP API: {search_query}, start={start}")
        
        response = requests.get(serp_url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if 'error' in data:
            logger.error(f"SERP API error: {data['error']}")
            raise Exception(f"SERP API error: {data['error']}")
        
        local_results = data.get('local_results', [])
        
        if not local_results:
            logger.info(f"No more results at start={start}")
            return {
                'results': [],
                'new_count': 0,
                'duplicate_count': 0,
                'has_more': False
            }
        
        # Processar resultados
        new_count = 0
        duplicate_count = 0
        processed_leads = []
        
        for result in local_results:
            lead_data = {
                'name': result.get('title', ''),
                'phone': result.get('phone'),
                'address': result.get('address', ''),
                'category': result.get('type', query),
                'rating': result.get('rating'),
                'reviews_count': result.get('reviews', 0),
                'website': result.get('website'),
            }
            
            # Gerar fingerprint
            fingerprint = generate_fingerprint(
                lead_data['name'],
                lead_data['address'],
                lead_data['phone'] or ''
            )
            
            # Verificar se já existe
            existing = supabase.client.table('leads')\
                .select('id, times_found, sources')\
                .eq('company_id', company_id)\
                .eq('fingerprint', fingerprint)\
                .maybe_single()\
                .execute()
            
            if existing.data:
                # DUPLICADO - Atualizar
                duplicate_count += 1
                
                sources = existing.data.get('sources', []) or []
                sources.append({
                    'found_at': datetime.now().isoformat(),
                    'query': query,
                    'location': location
                })
                
                supabase.client.table('leads').update({
                    'last_seen_at': datetime.now().isoformat(),
                    'times_found': existing.data['times_found'] + 1,
                    'sources': sources
                }).eq('id', existing.data['id']).execute()
                
                processed_leads.append({
                    **lead_data,
                    'id': existing.data['id'],
                    'is_duplicate': True,
                    'times_found': existing.data['times_found'] + 1
                })
                
            else:
                # NOVO - Inserir
                new_count += 1
                
                new_lead = supabase.client.table('leads').insert({
                    **lead_data,
                    'company_id': company_id,
                    'fingerprint': fingerprint,
                    'times_found': 1,
                    'sources': [{
                        'found_at': datetime.now().isoformat(),
                        'query': query,
                        'location': location
                    }],
                    'has_whatsapp': False,
                    'has_email': False
                }).execute()
                
                if new_lead.data:
                    processed_leads.append({
                        **new_lead.data[0],
                        'is_duplicate': False
                    })
        
        has_more = len(local_results) == 20  # SERP API retorna 20 por página
        
        logger.info(f"Search complete: {new_count} new, {duplicate_count} duplicates")
        
        return {
            'results': processed_leads,
            'new_count': new_count,
            'duplicate_count': duplicate_count,
            'has_more': has_more,
            'total_results': len(processed_leads)
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"SERP API request error: {e}")
        raise Exception(f"Failed to search leads: {str(e)}")
    except Exception as e:
        logger.error(f"Error in search_leads_serp: {e}")
        raise


from datetime import datetime
