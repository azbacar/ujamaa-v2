import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { useCreateProposal } from '@/hooks/useFreelance';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

interface Props {
  jobId: string;
}

export default function FreelanceProposalForm({ jobId }: Props) {
  const { user } = useAuth();
  const createProposal = useCreateProposal();
  const [form, setForm] = useState({
    cover_letter: '',
    proposed_amount: '',
    estimated_days: '',
  });

  if (!user) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground mb-3">Connectez-vous pour postuler à cette mission</p>
          <Link to="/auth">
            <Button>Se connecter</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cover_letter) return;

    createProposal.mutate({
      job_id: jobId,
      cover_letter: form.cover_letter,
      proposed_amount: form.proposed_amount ? Number(form.proposed_amount) : undefined,
      estimated_days: form.estimated_days ? Number(form.estimated_days) : undefined,
    }, {
      onSuccess: () => {
        setForm({ cover_letter: '', proposed_amount: '', estimated_days: '' });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-4 w-4" /> Postuler à cette mission
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cover_letter">Lettre de motivation *</Label>
            <Textarea
              id="cover_letter"
              value={form.cover_letter}
              onChange={e => setForm(f => ({ ...f, cover_letter: e.target.value }))}
              placeholder="Présentez-vous et expliquez pourquoi vous êtes le bon candidat..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="proposed_amount">Montant proposé (FC)</Label>
              <Input
                id="proposed_amount"
                type="number"
                value={form.proposed_amount}
                onChange={e => setForm(f => ({ ...f, proposed_amount: e.target.value }))}
                placeholder="150000"
              />
            </div>
            <div>
              <Label htmlFor="estimated_days">Durée estimée (jours)</Label>
              <Input
                id="estimated_days"
                type="number"
                value={form.estimated_days}
                onChange={e => setForm(f => ({ ...f, estimated_days: e.target.value }))}
                placeholder="15"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={createProposal.isPending}>
            {createProposal.isPending ? 'Envoi...' : 'Envoyer ma candidature'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
