import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Banknote } from 'lucide-react';
import { useJobProposals } from '@/hooks/useFreelance';

interface Props {
  jobId: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  accepted: { label: 'Acceptée', className: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Refusée', className: 'bg-red-100 text-red-700 border-red-200' },
  withdrawn: { label: 'Retirée', className: 'bg-muted text-muted-foreground' },
};

export default function FreelanceProposalList({ jobId }: Props) {
  const { data: proposals, isLoading } = useJobProposals(jobId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4">Chargement des candidatures...</p>;
  }

  if (!proposals?.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Aucune candidature pour le moment
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-4 w-4" /> Candidatures ({proposals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {proposals.map(proposal => {
          const st = statusMap[proposal.status] || statusMap.pending;
          return (
            <div key={proposal.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-foreground">{proposal.freelancer_username}</span>
                <Badge className={st.className}>{st.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{proposal.cover_letter}</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {proposal.proposed_amount && (
                  <span className="flex items-center gap-1">
                    <Banknote className="h-3 w-3" />
                    {proposal.proposed_amount.toLocaleString()} {proposal.currency}
                  </span>
                )}
                {proposal.estimated_days && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {proposal.estimated_days} jours
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
