import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DiasporaProject {
  id: string;
  title: string;
  description: string;
  full_content: string | null;
  category: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  author_id: string;
  island: string | null;
  location: string | null;
  status: string;
  images: string[] | null;
  deadline: string | null;
  min_investment: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  views: number;
  created_at: string;
  updated_at: string;
  is_carrier_verified?: boolean;
}

export interface ProjectInvestment {
  id: string;
  project_id: string;
  investor_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
}

// Fetch published diaspora projects
export function useDiasporaProjects(filters?: { category?: string; island?: string }) {
  return useQuery({
    queryKey: ['diaspora-projects', filters],
    queryFn: async () => {
      let query = supabase
        .from('diaspora_projects')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.island) query = query.eq('island', filters.island);

      const { data, error } = await query;
      if (error) throw error;
      const projects = data as DiasporaProject[];

      // Fetch carrier verification status for all authors
      if (projects.length > 0) {
        const authorIds = [...new Set(projects.map(p => p.author_id))];
        // Vue publique: pas de fuite phone/email
        const { data: carriers } = await supabase
          .from('project_carriers_public' as any)
          .select('user_id, is_verified')
          .in('user_id', authorIds)
          .eq('is_verified', true);

        // Also check annonceur roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', authorIds)
          .eq('role', 'annonceur');

        const verifiedCarriers = new Set((carriers || []).map((c: any) => c.user_id));
        const annonceurs = new Set((roles || []).map((r: any) => r.user_id));

        return projects.map(p => ({
          ...p,
          is_carrier_verified: verifiedCarriers.has(p.author_id) || annonceurs.has(p.author_id),
        }));
      }

      return projects;
    },
  });
}

// Fetch single project
export function useDiasporaProject(id: string | undefined) {
  return useQuery({
    queryKey: ['diaspora-project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('diaspora_projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      const project = data as DiasporaProject;

      // Check carrier verification
      const { data: carrier } = await supabase
        .from('project_carriers_public' as any)
        .select('is_verified')
        .eq('user_id', project.author_id)
        .eq('is_verified', true)
        .maybeSingle();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', project.author_id)
        .eq('role', 'annonceur')
        .maybeSingle();

      return {
        ...project,
        is_carrier_verified: !!(carrier || roleData),
      };
    },
    enabled: !!id,
  });
}

// Fetch my projects (author)
export function useMyDiasporaProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-diaspora-projects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('diaspora_projects')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DiasporaProject[];
    },
    enabled: !!user,
  });
}

// Fetch investments for a project
export function useProjectInvestments(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-investments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_investments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectInvestment[];
    },
    enabled: !!projectId,
  });
}

// Fetch my investments
export function useMyInvestments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-investments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('project_investments')
        .select('*')
        .eq('investor_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectInvestment[];
    },
    enabled: !!user,
  });
}

// Fetch project updates
export function useProjectUpdates(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-updates', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectUpdate[];
    },
    enabled: !!projectId,
  });
}

// Create project mutation
export function useCreateDiasporaProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (project: Omit<DiasporaProject, 'id' | 'current_amount' | 'views' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('diaspora_projects')
        .insert(project)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaspora-projects'] });
      queryClient.invalidateQueries({ queryKey: ['my-diaspora-projects'] });
      toast({ title: '✅ Projet créé', description: 'Votre projet a été soumis avec succès.' });
    },
    onError: (error: Error) => {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

// Update project mutation
export function useUpdateDiasporaProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiasporaProject> & { id: string }) => {
      const { data, error } = await supabase
        .from('diaspora_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaspora-projects'] });
      queryClient.invalidateQueries({ queryKey: ['my-diaspora-projects'] });
      toast({ title: '✅ Projet mis à jour' });
    },
    onError: (error: Error) => {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

// Create investment mutation
export function useCreateInvestment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (investment: Omit<ProjectInvestment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('project_investments')
        .insert(investment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-investments'] });
      queryClient.invalidateQueries({ queryKey: ['my-investments'] });
      toast({ title: '✅ Investissement enregistré', description: 'Votre proposition a été soumise.' });
    },
    onError: (error: Error) => {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

// Update investment status
export function useUpdateInvestmentStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('project_investments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-investments'] });
      queryClient.invalidateQueries({ queryKey: ['my-investments'] });
      toast({ title: '✅ Statut mis à jour' });
    },
    onError: (error: Error) => {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

// Create project update
export function useCreateProjectUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (update: Omit<ProjectUpdate, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('project_updates')
        .insert(update)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-updates'] });
      toast({ title: '✅ Mise à jour publiée' });
    },
    onError: (error: Error) => {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
    },
  });
}
