import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  user_id: string;
  company_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: any;
  created_at: string;
  read_at?: string;
}

const API_URL = import.meta.env.REACT_APP_BACKEND_URL;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (unreadOnly: boolean = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching notifications for user:', user.id);
      const response = await fetch(
        `${API_URL}/api/notifications?user_id=${user.id}&unread_only=${unreadOnly}&limit=20`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Notifications fetched:', data);
        setNotifications(data.notifications || []);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('Error fetching notifications:', response.status, errorText);
        setError(`Erro ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      console.log('Fetching unread count for user:', user.id);
      const response = await fetch(
        `${API_URL}/api/notifications/unread-count?user_id=${user.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Unread count:', data.unread_count);
        setUnreadCount(data.unread_count || 0);
      } else {
        console.error('Error fetching unread count:', response.status);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${notificationId}/read`,
        { method: "PUT" }
      );
      
      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/mark-all-read?user_id=${user.id}`,
        { method: "PUT" }
      );
      
      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user?.id]);

  const refresh = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.id, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  };
}
