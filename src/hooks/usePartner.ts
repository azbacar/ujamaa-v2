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
  latitude?: number | null;
  longitude?: number | null;
  is_visible_on_map?: boolean;
  opening_hours?: string | null;
  accepted_methods?: string[];
  kyc_status?: 'pending' | 'submitted' | 'approved' | 'rejected';
  kyc_reviewed_at?: string | null;
  kyc_rejection_reason?: string | null;
}

export interface PartnerKycDocument {
  id: string;
  partner_id: string;
  document_type: 'id_card' | 'passport' | 'business_license' | 'tax_certificate' | 'other';
  file_path: string;
  file_name: string;
  notes: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface PartnerSettings {
  id: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  currency: string;
  pro_plan_price: number;
  is_active: boolean;
  azzhy_deposit_commission_rate?: number;
}

export interface PartnerDeposit {
  id: string;
  partner_id: string;
  total_collected: number;
  commission_rate: number;
  commission_amount: number;
  net_deposited: number;
  currency: string;
  deposit_method: 'cash' | 'bank_transfer' | 'mobile_money';
  reference: string | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
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

export const usePartnerDeposits = (partnerId?: string) => {
  const [deposits, setDeposits] = useState<PartnerDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!partnerId) { setLoading(false); return; }
    const { data } = await supabase
      .from('partner_deposits')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(100);
    setDeposits((data as any) || []);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { deposits, loading, refresh };
};

export interface PublicPartner {
  id: string;
  business_name: string;
  contact_phone: string | null;
  island: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: string | null;
  accepted_methods: string[];
}

export const usePublicPartners = (island?: string) => {
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let q = supabase
      .from('partner_accounts_public')
      .select('id,business_name,contact_phone,island,city,address,latitude,longitude,opening_hours,accepted_methods')
      .eq('status', 'active')
      .eq('is_visible_on_map', true);
    if (island) q = q.eq('island', island);
    const { data } = await q.order('city', { ascending: true });
    setPartners((data as any) || []);
    setLoading(false);
  }, [island]);

  useEffect(() => { refresh(); }, [refresh]);

  return { partners, loading, refresh };
};

export const usePartnerKycDocuments = (partnerId?: string) => {
  const [documents, setDocuments] = useState<PartnerKycDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!partnerId) { setLoading(false); return; }
    const { data } = await supabase
      .from('partner_kyc_documents')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    setDocuments((data as any) || []);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { documents, loading, refresh };
};

export const computeCommission = (amount: number, settings: PartnerSettings | null): number => {
  if (!settings) return 0;
  if (settings.commission_type === 'percentage') {
    return Math.round((amount * settings.commission_value) / 100);
  }
  return settings.commission_value;
};

/** AZZHY commission on partner deposit (default 2%). */
export const computeDepositSplit = (
  totalCollected: number,
  settings: PartnerSettings | null
): { commissionRate: number; commissionAmount: number; netDeposited: number } => {
  const rate = Number(settings?.azzhy_deposit_commission_rate ?? 2);
  const commissionAmount = Math.round((totalCollected * rate) / 100);
  const netDeposited = Math.max(0, Math.round(totalCollected - commissionAmount));
  return { commissionRate: rate, commissionAmount, netDeposited };
};
