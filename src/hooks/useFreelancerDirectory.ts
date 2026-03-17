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
  created_at: string;
  updated_at: string;
}

export const useFreelancerProfiles = (filters?: { skills?: string[]; island?: string; search?: string }) => {
  return useQuery({
    queryKey: ['freelancer-profiles', filters],
    queryFn: async () => {
      let query = supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('is_visible', true)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (filters?.island && filters.island !== 'all') {
        query = query.eq('island', filters.island);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = (data || []) as FreelancerProfile[];

      // Client-side skill filter (array overlap)
      if (filters?.skills?.length) {
        const searchSkills = filters.skills.map(s => s.toLowerCase());
        results = results.filter(p =>
          p.skills.some(s => searchSkills.some(ss => s.toLowerCase().includes(ss)))
        );
      }

      // Client-side search
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(p =>
          p.display_name.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q) ||
          p.skills.some(s => s.toLowerCase().includes(q))
        );
      }

      return results;
    },
  });
};

export const useFreelancerProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['freelancer-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();

      if (error) throw error;
      return data as FreelancerProfile | null;
    },
    enabled: !!userId,
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
      
      // Check if profile exists
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
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('freelancer_profiles')
          .insert(payload)
          .select()
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
