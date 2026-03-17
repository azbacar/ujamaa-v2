import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Users, Eye, MapPin, Calendar, Banknote, Trash2, ExternalLink } from 'lucide-react';
import { useAdminFreelanceJobs, useAdminFreelanceProposals, useUpdateFreelanceJob, useUpdateProposalStatus, FREELANCE_CATEGORIES } from '@/hooks/useFreelance';
import { Link } from 'react-router-dom';

const jobStatusMap: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  published: { label: 'Publié', className: 'bg-green-100 text-green-700 border-green-200' },
  closed: { label: 'Clôturé', className: 'bg-muted text-muted-foreground' },
};

const proposalStatusMap: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  accepted: { label: 'Acceptée', className: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Refusée', className: 'bg-red-100 text-red-700 border-red-200' },
  withdrawn: { label: 'Retirée', className: 'bg-muted text-muted-foreground' },
};

export default function FreelanceManagementSection() {
  const { data: jobs, isLoading: jobsLoading } = useAdminFreelanceJobs();
  const { data: proposals, isLoading: proposalsLoading } = useAdminFreelanceProposals();
  const updateJob = useUpdateFreelanceJob();
  const updateProposal = useUpdateProposalStatus();
  const [jobFilter, setJobFilter] = useState<string>('all');

  const filteredJobs = jobs?.filter(j => jobFilter === 'all' || j.status === jobFilter) || [];

  const stats = {
    total: jobs?.length || 0,
    published: jobs?.filter(j => j.status === 'published').length || 0,
    draft: jobs?.filter(j => j.status === 'draft').length || 0,
    closed: jobs?.filter(j => j.status === 'closed').length || 0,
    totalProposals: proposals?.length || 0,
    pendingProposals: proposals?.filter(p => p.status === 'pending').length || 0,
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="h-5 w-5" /> Gestion Freelance
        </h2>
        <p className="text-sm text-slate-500 mt-1">Superviser les missions et candidatures</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total missions', value: stats.total, color: 'text-slate-900' },
          { label: 'Publiées', value: stats.published, color: 'text-green-600' },
          { label: 'Brouillons', value: stats.draft, color: 'text-amber-600' },
          { label: 'Clôturées', value: stats.closed, color: 'text-slate-500' },
          { label: 'Candidatures', value: stats.totalProposals, color: 'text-blue-600' },
          { label: 'En attente', value: stats.pendingProposals, color: 'text-orange-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Missions ({stats.total})</TabsTrigger>
          <TabsTrigger value="proposals">Candidatures ({stats.totalProposals})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4 mt-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'published', 'draft', 'closed'].map(f => (
              <Button
                key={f}
                size="sm"
                variant={jobFilter === f ? 'default' : 'outline'}
                onClick={() => setJobFilter(f)}
                className="text-xs"
              >
                {f === 'all' ? 'Tous' : jobStatusMap[f]?.label || f}
              </Button>
            ))}
          </div>

          {jobsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg" />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Aucune mission trouvée</p>
          ) : (
            <div className="space-y-2">
              {filteredJobs.map(job => {
                const st = jobStatusMap[job.status] || jobStatusMap.draft;
                const catLabel = FREELANCE_CATEGORIES.find(c => c.value === job.category)?.label || job.category;
                return (
                  <Card key={job.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm text-slate-900 truncate">{job.title}</h3>
                            <Badge className={st.className + ' text-xs'}>{st.label}</Badge>
                            <Badge variant="outline" className="text-xs">{catLabel}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            <span>Par {job.author_username}</span>
                            {job.island && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.island}</span>}
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{job.views} vues</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Link to={`/freelance/${job.id}`} target="_blank">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          {job.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-green-700 border-green-200 hover:bg-green-50"
                              onClick={() => updateJob.mutate({ id: job.id, status: 'published' })}
                              disabled={updateJob.isPending}
                            >
                              Publier
                            </Button>
                          )}
                          {job.status === 'published' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => updateJob.mutate({ id: job.id, status: 'closed' })}
                              disabled={updateJob.isPending}
                            >
                              Clôturer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="proposals" className="space-y-2 mt-4">
          {proposalsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg" />)}
            </div>
          ) : !proposals?.length ? (
            <p className="text-center text-slate-500 py-8">Aucune candidature</p>
          ) : (
            proposals.map(proposal => {
              const st = proposalStatusMap[proposal.status] || proposalStatusMap.pending;
              return (
                <Card key={proposal.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-900">{proposal.freelancer_username}</span>
                          <Badge className={st.className + ' text-xs'}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{proposal.cover_letter}</p>
                        <div className="flex gap-3 text-xs text-slate-500">
                          {proposal.proposed_amount && (
                            <span className="flex items-center gap-1">
                              <Banknote className="h-3 w-3" />{proposal.proposed_amount.toLocaleString()} {proposal.currency}
                            </span>
                          )}
                          {proposal.estimated_days && (
                            <span>{proposal.estimated_days} jours</span>
                          )}
                          <span>{new Date(proposal.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      {proposal.status === 'pending' && (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => updateProposal.mutate({ proposalId: proposal.id, status: 'accepted', jobId: proposal.job_id })}
                            disabled={updateProposal.isPending}
                          >
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => updateProposal.mutate({ proposalId: proposal.id, status: 'rejected', jobId: proposal.job_id })}
                            disabled={updateProposal.isPending}
                          >
                            Refuser
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
