import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FreelancerProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  skills: string[];
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  currency: string;
  experience_years: number;
  portfolio_url: string | null;
  island: string | null;
  location: string | null;
  is_available: boolean;
  is_visible: boolean;
  views: number;
  avatar_url: string | null;
  whatsapp: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  created_at: string;
  updated_at: string;
  // joined from users table
  account_type?: string;
}

export const useFreelancerProfiles = (filters?: { skills?: string[]; island?: string; search?: string }) => {
  return useQuery({
    queryKey: ['freelancer-profiles', filters],
    queryFn: async () => {
      // Listing public : utilise la vue sans contacts (whatsapp/réseaux sociaux exclus)
      let query = supabase
        .from('freelancer_profiles_public' as any)
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (filters?.island && filters.island !== 'all') {
        query = query.eq('island', filters.island);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = ((data || []) as unknown) as FreelancerProfile[];

      // Fetch account_type for each user to determine pro status
      const userIds = [...new Set(results.map(r => r.user_id))];
      if (userIds.length > 0) {
        const { data: usersPro } = await supabase
          .from('users_pro_status' as any)
          .select('id, is_pro')
          .in('id', userIds);

        const userMap = new Map(((usersPro || []) as any[]).map((u: any) => [u.id, u.is_pro ? 'pro' : 'free']));
        results = results.map(r => ({ ...r, account_type: userMap.get(r.user_id) || 'free' }));
      }

      if (filters?.skills?.length) {
        const searchSkills = filters.skills.map(s => s.toLowerCase());
        results = results.filter(p =>
          p.skills.some(s => searchSkills.some(ss => s.toLowerCase().includes(ss)))
        );
      }

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(p =>
          p.display_name.toLowerCase().includes(q) ||
          (p.bio || '').toLowerCase().includes(q) ||
          p.skills.some(s => s.toLowerCase().includes(q))
        );
      }

      return results;
    },
  });
};

// Columns explicitly enumerated to skip the `whatsapp` column,
// which is REVOKEd and exposed only via get_freelancer_whatsapp() RPC.
const FREELANCER_COLUMNS =
  'id, user_id, display_name, bio, skills, hourly_rate_min, hourly_rate_max, currency, experience_years, portfolio_url, island, location, is_available, is_visible, views, avatar_url, facebook_url, linkedin_url, twitter_url, instagram_url, created_at, updated_at';

const fetchWhatsapp = async (profileId: string): Promise<string | null> => {
  const { data } = await supabase.rpc('get_freelancer_whatsapp', { _profile_id: profileId });
  return (data as string | null) ?? null;
};

export const useFreelancerProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['freelancer-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelancer_profiles')
        .select(FREELANCER_COLUMNS)
        .eq('user_id', userId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const [{ data: u }, whatsapp] = await Promise.all([
        supabase.from('users').select('account_type').eq('id', data.user_id).maybeSingle(),
        fetchWhatsapp(data.id),
      ]);

      return { ...data, whatsapp, account_type: (u as any)?.account_type || 'free' } as FreelancerProfile;
    },
    enabled: !!userId,
  });
};

export const useFreelancerProfileById = (profileId?: string) => {
  return useQuery({
    queryKey: ['freelancer-profile-by-id', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelancer_profiles')
        .select(FREELANCER_COLUMNS)
        .eq('id', profileId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const [{ data: u }, whatsapp] = await Promise.all([
        supabase.from('users').select('account_type').eq('id', data.user_id).maybeSingle(),
        fetchWhatsapp(data.id),
      ]);

      return { ...data, whatsapp, account_type: (u as any)?.account_type || 'free' } as FreelancerProfile;
    },
    enabled: !!profileId,
  });
};

export const useMyFreelancerProfile = () => {
  const { user } = useAuth();
  return useFreelancerProfile(user?.id);
};

export const useUpsertFreelancerProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profile: Partial<FreelancerProfile>) => {
      const payload = { ...profile, user_id: user!.id };
      delete (payload as any).account_type;
      
      const { data: existing } = await supabase
        .from('freelancer_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('freelancer_profiles')
          .update(payload)
          .eq('user_id', user!.id)
          .select(FREELANCER_COLUMNS)
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('freelancer_profiles')
          .insert([{ ...payload, display_name: payload.display_name || '' }] as any)
          .select(FREELANCER_COLUMNS)
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile', user!.id] });
      toast.success('Profil freelancer mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil');
    },
  });
};

export const useDeleteFreelancerProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('freelancer_profiles')
        .delete()
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['freelancer-profile'] });
      toast.success('Profil freelancer supprimé');
    },
  });
};
