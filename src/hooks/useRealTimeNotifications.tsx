import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  link?: string;
}

const GLOBAL_READ_KEY = 'ujamaan_global_notifs_read';
const GLOBAL_DISMISSED_KEY = 'ujamaan_global_notifs_dismissed';

const loadIds = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveId = (key: string, id: string) => {
  try {
    const ids = loadIds(key);
    if (!ids.includes(id)) {
      localStorage.setItem(key, JSON.stringify([...ids, id].slice(-200)));
    }
  } catch {
    // stockage indisponible : on ignore
  }
};

export const useRealTimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time updates for notifications
    const channels: any[] = [];
    
    if (user) {
      const notifChannel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => fetchNotifications()
        )
        .subscribe();
      channels.push(notifChannel);
    }

    // Subscribe to global announcements (for all users)
    const globalChannel = supabase
      .channel('global_announcements_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_announcements' },
        () => fetchNotifications()
      )
      .subscribe();
    channels.push(globalChannel);

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const results: Notification[] = [];

      // Fetch global announcements (available to everyone)
      const { data: globalData } = await supabase
        .from('global_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (globalData) {
        const readIds = loadIds(GLOBAL_READ_KEY);
        const dismissedIds = loadIds(GLOBAL_DISMISSED_KEY);
        results.push(...globalData
          .map(g => ({
            id: `global-${g.id}`,
            title: g.title,
            message: g.content,
            type: (g.type === 'urgent' ? 'error' : g.type === 'warning' ? 'warning' : g.type === 'maintenance' ? 'warning' : 'info') as Notification['type'],
            timestamp: new Date(g.created_at),
            read: readIds.includes(`global-${g.id}`),
            link: undefined,
          }))
          .filter(n => !dismissedIds.includes(n.id)));
      }

      // Fetch user-specific notifications if logged in
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data) {
          results.push(...data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type as Notification['type'],
            timestamp: new Date(n.created_at),
            read: n.read ?? false,
            link: n.link ?? undefined,
          })));
        }
      }

      // Sort by timestamp desc and deduplicate
      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setNotifications(results);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    // Global announcements: persisted locally (no per-user column in DB)
    if (id.startsWith('global-')) {
      saveId(GLOBAL_READ_KEY, id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      return;
    }
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    // Global announcements: dismissal persisted locally
    if (id.startsWith('global-')) {
      saveId(GLOBAL_DISMISSED_KEY, id);
      saveId(GLOBAL_READ_KEY, id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      return;
    }
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return {
    notifications,
    loading,
    markAsRead,
    deleteNotification,
    refresh: fetchNotifications
  };
};
