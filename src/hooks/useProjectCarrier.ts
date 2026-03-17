import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ProjectCarrier {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  phone: string | null;
  email: string | null;
  island: string | null;
  location: string | null;
  organization: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useMyCarrierProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['project-carrier', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('project_carriers' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ProjectCarrier | null;
    },
    enabled: !!user,
  });
};

export const useCreateCarrierProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (profile: Omit<ProjectCarrier, 'id' | 'is_verified' | 'is_active' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('project_carriers' as any)
        .insert(profile)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-carrier'] });
      toast({ title: '✅ Profil porteur de projet créé' });
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
};

export const useUpdateCarrierProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectCarrier> & { id: string }) => {
      const { data, error } = await supabase
        .from('project_carriers' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-carrier'] });
      toast({ title: '✅ Profil mis à jour' });
    },
    onError: (err: any) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });
};
