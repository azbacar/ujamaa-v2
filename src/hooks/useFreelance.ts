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

      // Enrich with author usernames
      const authorIds = [...new Set((data || []).map(j => j.author_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('id', authorIds);

      const userMap = new Map((users || []).map(u => [u.id, u.username]));
      return (data || []).map(job => ({
        ...job,
        skills: job.skills || [],
        author_username: userMap.get(job.author_id) || 'Anonyme',
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

      const { data: author } = await supabase
        .from('users')
        .select('username')
        .eq('id', data.author_id)
        .maybeSingle();

      return {
        ...data,
        skills: data.skills || [],
        author_username: author?.username || 'Anonyme',
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
      return (data || []) as FreelanceJob[];
    },
    enabled: !!user,
  });
};

export const useCreateFreelanceJob = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (job: Omit<FreelanceJob, 'id' | 'author_id' | 'views' | 'created_at' | 'updated_at' | 'author_username'>) => {
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
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('id', freelancerIds);

      const userMap = new Map((users || []).map(u => [u.id, u.username]));
      return (data || []).map(p => ({
        ...p,
        freelancer_username: userMap.get(p.freelancer_id) || 'Anonyme',
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
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('id', reviewerIds);

      const userMap = new Map((users || []).map(u => [u.id, u.username]));
      return (data || []).map(r => ({
        ...r,
        reviewer_username: userMap.get(r.reviewer_id) || 'Anonyme',
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
