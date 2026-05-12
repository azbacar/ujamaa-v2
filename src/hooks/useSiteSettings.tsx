import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  site_name: string;
  site_logo_url?: string;
  site_favicon_url?: string;
  ga_tracking_id?: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url?: string;
  ai_assistant_enabled: boolean;
  ai_assistant_name: string;
  ai_assistant_welcome_message: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  twitter_card?: string;
  twitter_site?: string;
  seo_keywords?: string;
}

const fetchSettings = async (): Promise<SiteSettings | null> => {
  const { data, error } = await supabase
    .from('site_settings_public')
    .select('site_name, site_logo_url, site_favicon_url, ga_tracking_id, hero_title, hero_subtitle, hero_image_url, ai_assistant_enabled, ai_assistant_name, ai_assistant_welcome_message, og_title, og_description, og_image_url, twitter_card, twitter_site, seo_keywords')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching site settings:', error);
    return null;
  }
  return data;
};

export const useSiteSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings = null, isLoading: loading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('site_settings_global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['site-settings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { settings, loading };
};
