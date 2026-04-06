import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeStats {
  userCount: number;
  contentCount: number;
  announcementsCount: number;
  pendingModifications: number;
  totalModifications: number;
  adsCount: number;
  analyticsViews: number;
  eventsCount: number;
  upcomingEventsCount: number;
  eventRegistrationsCount: number;
  loading: boolean;
  error: string | null;
}

export const useRealTimeStats = () => {
  const [stats, setStats] = useState<RealTimeStats>({
    userCount: 0,
    contentCount: 0,
    announcementsCount: 0,
    pendingModifications: 0,
    totalModifications: 0,
    adsCount: 0,
    analyticsViews: 0,
    eventsCount: 0,
    upcomingEventsCount: 0,
    eventRegistrationsCount: 0,
    loading: true,
    error: null
  });

  const fetchStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      const [
        usersResult, contentResult, announcementsResult,
        pendingModsResult, totalModsResult, adsResult,
        analyticsResult, eventsResult, upcomingEventsResult,
        registrationsResult
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('content_items').select('*', { count: 'exact', head: true }),
        supabase.from('global_announcements').select('*', { count: 'exact', head: true }),
        supabase.from('pending_modifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('pending_modifications').select('*', { count: 'exact', head: true }),
        supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('site_analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('date', new Date().toISOString()),
        supabase.from('event_registrations').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        userCount: usersResult.count || 0,
        contentCount: contentResult.count || 0,
        announcementsCount: announcementsResult.count || 0,
        pendingModifications: pendingModsResult.count || 0,
        totalModifications: totalModsResult.count || 0,
        adsCount: adsResult.count || 0,
        analyticsViews: analyticsResult.count || 0,
        eventsCount: eventsResult.count || 0,
        upcomingEventsCount: upcomingEventsResult.count || 0,
        eventRegistrationsCount: registrationsResult.count || 0,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur lors du chargement des statistiques'
      }));
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Single channel listening to multiple tables (admin-only hook)
    const channel = supabase
      .channel('admin_stats_combined')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_items' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_modifications' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { ...stats, refresh: fetchStats };
};
