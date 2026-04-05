import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EnterpriseProfile {
  id: string;
  user_id: string;
  name: string;
  rccm: string | null;
  nif: string | null;
  sector: string;
  address: string | null;
  island: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  is_verified: boolean;
  verified_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TenderSubmission {
  id: string;
  tender_id: string;
  enterprise_id: string;
  cover_letter: string;
  proposed_amount: number | null;
  currency: string;
  documents: string[];
  status: string;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  tender?: { title: string; category: string | null; status: string };
}

export interface EnterpriseMember {
  id: string;
  enterprise_id: string;
  user_id: string;
  role: string;
  created_at: string;
  username?: string;
  email?: string;
}

export function useEnterprise() {
  const { user } = useAuth();
  const [enterprise, setEnterprise] = useState<EnterpriseProfile | null>(null);
  const [submissions, setSubmissions] = useState<TenderSubmission[]>([]);
  const [members, setMembers] = useState<EnterpriseMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchEnterprise();
    else { setEnterprise(null); setLoading(false); }
  }, [user]);

  const fetchEnterprise = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('enterprise_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setEnterprise(data as EnterpriseProfile | null);
    
    if (data) {
      await Promise.all([fetchSubmissions(data.id), fetchMembers(data.id)]);
    }
    setLoading(false);
  };

  const fetchSubmissions = async (enterpriseId: string) => {
    const { data } = await supabase
      .from('tender_submissions')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .order('created_at', { ascending: false });

    // Fetch tender titles
    if (data && data.length > 0) {
      const tenderIds = [...new Set(data.map(s => s.tender_id))];
      const { data: tenders } = await supabase
        .from('content_items')
        .select('id, title, category, status')
        .in('id', tenderIds);

      const tenderMap = new Map((tenders || []).map(t => [t.id, t]));
      const enriched = data.map(s => ({
        ...s,
        documents: s.documents || [],
        tender: tenderMap.get(s.tender_id) || undefined,
      }));
      setSubmissions(enriched as TenderSubmission[]);
    } else {
      setSubmissions([]);
    }
  };

  const fetchMembers = async (enterpriseId: string) => {
    const { data } = await supabase
      .from('enterprise_members')
      .select('*')
      .eq('enterprise_id', enterpriseId)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      const userIds = data.map(m => m.user_id);
      const { data: users } = await supabase.rpc('get_public_usernames', { _user_ids: userIds });
      const userMap = new Map((users || []).map(u => [u.id, u]));
      setMembers(data.map(m => ({
        ...m,
        username: userMap.get(m.user_id)?.username || 'Inconnu',
      })));
    } else {
      setMembers([]);
    }
  };

  const createEnterprise = async (profile: Partial<EnterpriseProfile>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('enterprise_profiles')
      .insert({ ...profile, user_id: user.id } as any)
      .select()
      .single();
    if (error) throw error;
    setEnterprise(data as EnterpriseProfile);
    return data;
  };

  const updateEnterprise = async (updates: Partial<EnterpriseProfile>) => {
    if (!enterprise) return;
    const { error } = await supabase
      .from('enterprise_profiles')
      .update(updates as any)
      .eq('id', enterprise.id);
    if (error) throw error;
    setEnterprise(prev => prev ? { ...prev, ...updates } : null);
  };

  const submitTender = async (submission: { tender_id: string; cover_letter: string; proposed_amount?: number; currency?: string }) => {
    if (!enterprise) throw new Error('Pas d\'entreprise');
    const { data, error } = await supabase
      .from('tender_submissions')
      .insert({ ...submission, enterprise_id: enterprise.id } as any)
      .select()
      .single();
    if (error) throw error;
    await fetchSubmissions(enterprise.id);
    return data;
  };

  const addMember = async (userId: string, role: string = 'member') => {
    if (!enterprise) throw new Error('Pas d\'entreprise');
    const { error } = await supabase
      .from('enterprise_members')
      .insert({ enterprise_id: enterprise.id, user_id: userId, role } as any);
    if (error) throw error;
    await fetchMembers(enterprise.id);
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('enterprise_members')
      .delete()
      .eq('id', memberId);
    if (error) throw error;
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  return {
    enterprise,
    submissions,
    members,
    loading,
    createEnterprise,
    updateEnterprise,
    submitTender,
    addMember,
    removeMember,
    refresh: fetchEnterprise,
  };
}
