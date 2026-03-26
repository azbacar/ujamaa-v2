import { useState, useEffect } from 'react';
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

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('site_name, site_logo_url, site_favicon_url, ga_tracking_id, hero_title, hero_subtitle, hero_image_url, ai_assistant_enabled, ai_assistant_name, ai_assistant_welcome_message, og_title, og_description, og_image_url, twitter_card, twitter_site, seo_keywords')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching site settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading };
};
