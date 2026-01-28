"""
Supabase Database Service
Handles all database operations using Supabase REST API
"""
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)


class SupabaseService:
    def __init__(self):
        self.url = os.environ.get('SUPABASE_URL')
        self.key = os.environ.get('SUPABASE_KEY')
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
        
        self.client: Client = create_client(self.url, self.key)
    
    # ========== Campaigns ==========
    async def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new campaign"""
        result = self.client.table('campaigns').insert(campaign_data).execute()
        return result.data[0] if result.data else None
    
    async def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Get a campaign by ID"""
        result = self.client.table('campaigns').select('*').eq('id', campaign_id).execute()
        return result.data[0] if result.data else None
    
    async def get_campaigns_by_company(self, company_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all campaigns for a company"""
        result = self.client.table('campaigns')\
            .select('*')\
            .eq('company_id', company_id)\
            .order('created_at', desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        return result.data or []
    
    async def update_campaign(self, campaign_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a campaign"""
        update_data['updated_at'] = datetime.utcnow().isoformat()
        result = self.client.table('campaigns').update(update_data).eq('id', campaign_id).execute()
        return result.data[0] if result.data else None
    
    async def delete_campaign(self, campaign_id: str) -> bool:
        """Delete a campaign"""
        result = self.client.table('campaigns').delete().eq('id', campaign_id).execute()
        return len(result.data) > 0 if result.data else False
    
    async def increment_campaign_counter(self, campaign_id: str, field: str, value: int = 1) -> None:
        """Increment a campaign counter (sent_count, error_count, pending_count)"""
        campaign = await self.get_campaign(campaign_id)
        if campaign:
            new_value = (campaign.get(field) or 0) + value
            await self.update_campaign(campaign_id, {field: new_value})
    
    # ========== Contacts ==========
    async def create_contacts(self, contacts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create multiple contacts"""
        if not contacts:
            return []
        result = self.client.table('campaign_contacts').insert(contacts).execute()
        return result.data or []
    
    async def get_contact(self, contact_id: str) -> Optional[Dict[str, Any]]:
        """Get a contact by ID"""
        result = self.client.table('campaign_contacts').select('*').eq('id', contact_id).execute()
        return result.data[0] if result.data else None
    
    async def get_contacts_by_campaign(
        self, 
        campaign_id: str, 
        status: Optional[str] = None,
        limit: int = 100, 
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get contacts for a campaign"""
        query = self.client.table('campaign_contacts')\
            .select('*')\
            .eq('campaign_id', campaign_id)
        
        if status:
            query = query.eq('status', status)
        
        result = query.range(offset, offset + limit - 1).execute()
        return result.data or []
    
    async def get_next_pending_contact(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Get next pending contact for a campaign"""
        result = self.client.table('campaign_contacts')\
            .select('*')\
            .eq('campaign_id', campaign_id)\
            .eq('status', 'pending')\
            .limit(1)\
            .execute()
        return result.data[0] if result.data else None
    
    async def update_contact(self, contact_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a contact"""
        result = self.client.table('campaign_contacts').update(update_data).eq('id', contact_id).execute()
        return result.data[0] if result.data else None
    
    async def delete_contacts_by_campaign(self, campaign_id: str) -> int:
        """Delete all contacts for a campaign"""
        result = self.client.table('campaign_contacts').delete().eq('campaign_id', campaign_id).execute()
        return len(result.data) if result.data else 0
    
    async def reset_contacts_status(self, campaign_id: str) -> int:
        """Reset all contacts to pending status"""
        result = self.client.table('campaign_contacts')\
            .update({
                'status': 'pending',
                'error_message': None,
                'sent_at': None
            })\
            .eq('campaign_id', campaign_id)\
            .execute()
        return len(result.data) if result.data else 0
    
    async def count_contacts(self, campaign_id: str, status: Optional[str] = None) -> int:
        """Count contacts for a campaign"""
        query = self.client.table('campaign_contacts')\
            .select('id', count='exact')\
            .eq('campaign_id', campaign_id)
        
        if status:
            query = query.eq('status', status)
        
        result = query.execute()
        return result.count or 0
    
    # ========== Message Logs ==========
    async def create_message_log(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a message log entry"""
        result = self.client.table('message_logs').insert(log_data).execute()
        return result.data[0] if result.data else None
    
    async def get_message_logs(
        self,
        campaign_id: str,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get message logs for a campaign"""
        query = self.client.table('message_logs')\
            .select('*')\
            .eq('campaign_id', campaign_id)\
            .order('sent_at', desc=True)
        
        if status:
            query = query.eq('status', status)
        
        result = query.range(offset, offset + limit - 1).execute()
        return result.data or []
    
    async def count_message_logs(self, campaign_id: str, status: Optional[str] = None) -> int:
        """Count message logs for a campaign"""
        query = self.client.table('message_logs')\
            .select('id', count='exact')\
            .eq('campaign_id', campaign_id)
        
        if status:
            query = query.eq('status', status)
        
        result = query.execute()
        return result.count or 0
    
    async def delete_message_logs_by_campaign(self, campaign_id: str) -> int:
        """Delete all message logs for a campaign"""
        result = self.client.table('message_logs').delete().eq('campaign_id', campaign_id).execute()
        return len(result.data) if result.data else 0
    
    async def count_messages_sent_today(self, campaign_id: str) -> int:
        """Count messages sent today for a campaign"""
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        
        result = self.client.table('message_logs')\
            .select('id', count='exact')\
            .eq('campaign_id', campaign_id)\
            .eq('status', 'sent')\
            .gte('sent_at', today)\
            .execute()
        
        return result.count or 0
    
    # ========== Dashboard Stats ==========
    async def get_dashboard_stats(self, company_id: str) -> Dict[str, Any]:
        """Get dashboard statistics for a company"""
        # Total campaigns
        campaigns_result = self.client.table('campaigns')\
            .select('id', count='exact')\
            .eq('company_id', company_id)\
            .execute()
        total_campaigns = campaigns_result.count or 0
        
        # Active campaigns
        active_result = self.client.table('campaigns')\
            .select('id', count='exact')\
            .eq('company_id', company_id)\
            .eq('status', 'running')\
            .execute()
        active_campaigns = active_result.count or 0
        
        # Total sent messages
        campaigns = self.client.table('campaigns')\
            .select('sent_count')\
            .eq('company_id', company_id)\
            .execute()
        total_sent = sum(c.get('sent_count', 0) for c in (campaigns.data or []))
        
        # Messages sent today
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        today_result = self.client.table('message_logs')\
            .select('id', count='exact')\
            .eq('status', 'sent')\
            .gte('sent_at', today)\
            .execute()
        messages_today = today_result.count or 0
        
        return {
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_messages_sent": total_sent,
            "messages_sent_today": messages_today
        }
    
    # ========== Notifications ==========
    async def get_notifications(self, user_id: str, limit: int = 50, unread_only: bool = False) -> List[Dict[str, Any]]:
        """Get user notifications"""
        query = self.client.table('notifications')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .limit(limit)
        
        if unread_only:
            query = query.eq('read', False)
        
        result = query.execute()
        return result.data or []
    
    async def get_unread_notification_count(self, user_id: str) -> int:
        """Get unread notification count"""
        result = self.client.table('notifications')\
            .select('id', count='exact')\
            .eq('user_id', user_id)\
            .eq('read', False)\
            .execute()
        return result.count or 0
    
    async def mark_notification_read(self, notification_id: str) -> bool:
        """Mark notification as read"""
        try:
            result = self.client.table('notifications')\
                .update({'read': True, 'read_at': datetime.utcnow().isoformat()})\
                .eq('id', notification_id)\
                .execute()
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return False
    
    async def mark_all_notifications_read(self, user_id: str) -> bool:
        """Mark all notifications as read"""
        try:
            result = self.client.table('notifications')\
                .update({'read': True, 'read_at': datetime.utcnow().isoformat()})\
                .eq('user_id', user_id)\
                .eq('read', False)\
                .execute()
            return True
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
            return False
    
    async def create_notification(
        self, 
        user_id: str, 
        company_id: str,
        notification_type: str,
        title: str,
        message: str,
        link: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """Create a notification"""
        try:
            notification_data = {
                'user_id': user_id,
                'company_id': company_id,
                'type': notification_type,
                'title': title,
                'message': message,
                'link': link,
                'metadata': metadata,
                'read': False
            }
            result = self.client.table('notifications').insert(notification_data).execute()
            return result.data[0]['id'] if result.data else None
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return None
    
    # ========== Quotas ==========
    async def get_user_quota(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user quota"""
        try:
            result = self.client.table('user_quotas')\
                .select('*')\
                .eq('user_id', user_id)\
                .single()\
                .execute()
            return result.data
        except Exception as e:
            logger.error(f"Error getting user quota: {e}")
            return None
    
    async def check_quota(self, user_id: str, action: str) -> Dict[str, Any]:
        """Check if user can perform action"""
        try:
            result = self.client.rpc('check_user_quota', {
                'p_user_id': user_id,
                'p_action': action
            }).execute()
            return result.data if result.data else {'allowed': False, 'reason': 'Unknown error'}
        except Exception as e:
            logger.error(f"Error checking quota: {e}")
            return {'allowed': False, 'reason': str(e)}
    
    async def increment_quota(self, user_id: str, action: str, amount: int = 1) -> bool:
        """Increment quota usage"""
        try:
            self.client.rpc('increment_quota_usage', {
                'p_user_id': user_id,
                'p_action': action,
                'p_amount': amount
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error incrementing quota: {e}")
            return False
    
    async def upgrade_plan(self, user_id: str, plan_type: str, plan_name: str) -> bool:
        """Upgrade user plan"""
        try:
            self.client.rpc('upgrade_user_plan', {
                'p_user_id': user_id,
                'p_plan_type': plan_type,
                'p_plan_name': plan_name
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error upgrading plan: {e}")
            return False


# Global instance
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Get or create Supabase service instance"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
