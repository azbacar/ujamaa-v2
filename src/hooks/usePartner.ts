import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PartnerAccount {
  id: string;
  user_id: string;
  business_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  island: string | null;
  city: string | null;
  address: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface PartnerSettings {
  id: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  currency: string;
  pro_plan_price: number;
  is_active: boolean;
}

export interface PartnerTransaction {
  id: string;
  partner_id: string;
  client_user_id: string;
  client_email: string | null;
  client_phone: string | null;
  plan: string;
  amount_collected: number;
  commission_amount: number;
  currency: string;
  reference: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export const usePartnerSettings = () => {
  const [settings, setSettings] = useState<PartnerSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('partner_settings')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSettings(data as any);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { settings, loading, refresh };
};

export const useMyPartnerAccount = () => {
  const { user } = useAuth();
  const [account, setAccount] = useState<PartnerAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('partner_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setAccount(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { account, loading, refresh };
};

export const usePartnerTransactions = (partnerId?: string) => {
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!partnerId) { setLoading(false); return; }
    const { data } = await supabase
      .from('partner_transactions')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(200);
    setTransactions((data as any) || []);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { transactions, loading, refresh };
};

export const computeCommission = (amount: number, settings: PartnerSettings | null): number => {
  if (!settings) return 0;
  if (settings.commission_type === 'percentage') {
    return Math.round((amount * settings.commission_value) / 100);
  }
  return settings.commission_value;
};
