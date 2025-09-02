import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeStats {
  userCount: number;
  contentCount: number;
  announcementsCount: number;
  pendingModifications: number;
  totalModifications: number;
  adsCount: number;
  analyticsViews: number;
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
    loading: true,
    error: null
  });

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all stats in parallel
      const [
        usersResult,
        contentResult,
        announcementsResult,
        pendingModsResult,
        totalModsResult,
        adsResult,
        analyticsResult
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('content_items').select('*', { count: 'exact', head: true }),
        supabase.from('global_announcements').select('*', { count: 'exact', head: true }),
        supabase.from('pending_modifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('pending_modifications').select('*', { count: 'exact', head: true }),
        supabase.from('ads').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('site_analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view')
      ]);

      setStats({
        userCount: usersResult.count || 0,
        contentCount: contentResult.count || 0,
        announcementsCount: announcementsResult.count || 0,
        pendingModifications: pendingModsResult.count || 0,
        totalModifications: totalModsResult.count || 0,
        adsCount: adsResult.count || 0,
        analyticsViews: analyticsResult.count || 0,
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
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscriptions for key tables
    const usersChannel = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        () => fetchStats()
      )
      .subscribe();

    const contentChannel = supabase
      .channel('content_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'content_items' }, 
        () => fetchStats()
      )
      .subscribe();

    const modsChannel = supabase
      .channel('modifications_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pending_modifications' }, 
        () => fetchStats()
      )
      .subscribe();

    const adsChannel = supabase
      .channel('ads_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ads' }, 
        () => fetchStats()
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(contentChannel);
      supabase.removeChannel(modsChannel);
      supabase.removeChannel(adsChannel);
    };
  }, []);

  return { ...stats, refresh: fetchStats };
};