import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FreelanceJob {
  id: string;
  author_id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  location: string | null;
  island: string | null;
  is_remote: boolean;
  deadline: string | null;
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
  author_username?: string;
  author_avatar_url?: string;
}

export interface FreelanceProposal {
  id: string;
  job_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_amount: number | null;
  currency: string;
  estimated_days: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  freelancer_username?: string;
}

export interface FreelanceReview {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_username?: string;
}

// Helper to fetch public usernames via security definer function
async function fetchUsernames(userIds: string[]): Promise<Map<string, { username: string; avatar_url: string | null }>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase.rpc('get_public_usernames', { _user_ids: userIds });
  return new Map((data || []).map((u: any) => [u.id, { username: u.username, avatar_url: u.avatar_url }]));
}

export const useFreelanceJobs = (category?: string) => {
  return useQuery({
    queryKey: ['freelance-jobs', category],
    queryFn: async () => {
      let query = supabase
        .from('freelance_jobs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      const authorIds = [...new Set((data || []).map(j => j.author_id))];
      const userMap = await fetchUsernames(authorIds);

      return (data || []).map(job => ({
        ...job,
        skills: job.skills || [],
        is_remote: job.is_remote ?? false,
        author_username: userMap.get(job.author_id)?.username || 'Anonyme',
        author_avatar_url: userMap.get(job.author_id)?.avatar_url || null,
      })) as FreelanceJob[];
    },
  });
};

export const useFreelanceJob = (id: string) => {
  return useQuery({
    queryKey: ['freelance-job', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelance_jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Increment views
      supabase
        .from('freelance_jobs')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id)
        .then();

      const userMap = await fetchUsernames([data.author_id]);

      return {
        ...data,
        skills: data.skills || [],
        is_remote: data.is_remote ?? false,
        author_username: userMap.get(data.author_id)?.username || 'Anonyme',
        author_avatar_url: userMap.get(data.author_id)?.avatar_url || null,
      } as FreelanceJob;
    },
    enabled: !!id,
  });
};

export const useMyFreelanceJobs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-freelance-jobs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelance_jobs')
        .select('*')
        .eq('author_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(j => ({ ...j, skills: j.skills || [], is_remote: j.is_remote ?? false })) as FreelanceJob[];
    },
    enabled: !!user,
  });
};

export const useCreateFreelanceJob = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (job: Omit<FreelanceJob, 'id' | 'author_id' | 'views' | 'created_at' | 'updated_at' | 'author_username' | 'author_avatar_url'>) => {
      const { data, error } = await supabase
        .from('freelance_jobs')
        .insert({ ...job, author_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelance-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-freelance-jobs'] });
      toast.success('Mission créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la mission');
    },
  });
};

export const useUpdateFreelanceJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FreelanceJob> & { id: string }) => {
      const { data, error } = await supabase
        .from('freelance_jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['freelance-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['freelance-job', data.id] });
      queryClient.invalidateQueries({ queryKey: ['my-freelance-jobs'] });
      toast.success('Mission mise à jour avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });
};

export const useJobProposals = (jobId: string) => {
  return useQuery({
    queryKey: ['freelance-proposals', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelance_proposals')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const freelancerIds = [...new Set((data || []).map(p => p.freelancer_id))];
      const userMap = await fetchUsernames(freelancerIds);

      return (data || []).map(p => ({
        ...p,
        freelancer_username: userMap.get(p.freelancer_id)?.username || 'Anonyme',
      })) as FreelanceProposal[];
    },
    enabled: !!jobId,
  });
};

export const useCreateProposal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (proposal: { job_id: string; cover_letter: string; proposed_amount?: number; estimated_days?: number }) => {
      const { data, error } = await supabase
        .from('freelance_proposals')
        .insert({
          ...proposal,
          freelancer_id: user!.id,
          currency: 'FC',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['freelance-proposals', vars.job_id] });
      toast.success('Candidature envoyée avec succès');
    },
    onError: (error: any) => {
      if (error?.code === '23505') {
        toast.error('Vous avez déjà postulé à cette mission');
      } else {
        toast.error('Erreur lors de l\'envoi de la candidature');
      }
    },
  });
};

export const useUpdateProposalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proposalId, status, jobId }: { proposalId: string; status: string; jobId: string }) => {
      const { data, error } = await supabase
        .from('freelance_proposals')
        .update({ status })
        .eq('id', proposalId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, jobId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['freelance-proposals', data.jobId] });
      const labels: Record<string, string> = { accepted: 'acceptée', rejected: 'refusée' };
      toast.success(`Candidature ${labels[data.status] || 'mise à jour'}`);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });
};

// Admin: fetch all jobs (any status)
export const useAdminFreelanceJobs = () => {
  return useQuery({
    queryKey: ['admin-freelance-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelance_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const authorIds = [...new Set((data || []).map(j => j.author_id))];
      const userMap = await fetchUsernames(authorIds);

      return (data || []).map(job => ({
        ...job,
        skills: job.skills || [],
        is_remote: job.is_remote ?? false,
        author_username: userMap.get(job.author_id)?.username || 'Anonyme',
      })) as FreelanceJob[];
    },
  });
};

// Admin: fetch all proposals
export const useAdminFreelanceProposals = () => {
  return useQuery({
    queryKey: ['admin-freelance-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelance_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const freelancerIds = [...new Set((data || []).map(p => p.freelancer_id))];
      const userMap = await fetchUsernames(freelancerIds);

      return (data || []).map(p => ({
        ...p,
        freelancer_username: userMap.get(p.freelancer_id)?.username || 'Anonyme',
      })) as FreelanceProposal[];
    },
  });
};

export const useJobReviews = (jobId: string) => {
  return useQuery({
    queryKey: ['freelance-reviews', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('freelance_reviews')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewerIds = [...new Set((data || []).map(r => r.reviewer_id))];
      const userMap = await fetchUsernames(reviewerIds);

      return (data || []).map(r => ({
        ...r,
        reviewer_username: userMap.get(r.reviewer_id)?.username || 'Anonyme',
      })) as FreelanceReview[];
    },
    enabled: !!jobId,
  });
};

export const FREELANCE_CATEGORIES = [
  { value: 'dev', label: 'Développement' },
  { value: 'design', label: 'Design & Graphisme' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'redaction', label: 'Rédaction' },
  { value: 'traduction', label: 'Traduction' },
  { value: 'comptabilite', label: 'Comptabilité' },
  { value: 'formation', label: 'Formation' },
  { value: 'artisanat', label: 'Artisanat' },
  { value: 'transport', label: 'Transport & Logistique' },
  { value: 'autre', label: 'Autre' },
];

export const COMOROS_ISLANDS = [
  'Grande Comore',
  'Anjouan',
  'Mohéli',
  'Mayotte',
];
