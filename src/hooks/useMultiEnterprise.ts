import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EnterpriseProfile } from '@/hooks/useEnterprise';

export function useMultiEnterprise() {
  const { user } = useAuth();
  const [enterprises, setEnterprises] = useState<EnterpriseProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnterprises = useCallback(async () => {
    if (!user) { setEnterprises([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('enterprise_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setEnterprises((data || []) as EnterpriseProfile[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEnterprises(); }, [fetchEnterprises]);

  const createEnterprise = async (profile: Partial<EnterpriseProfile>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('enterprise_profiles')
      .insert({ ...profile, user_id: user.id } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchEnterprises();
    return data;
  };

  return { enterprises, loading, createEnterprise, refresh: fetchEnterprises };
}
