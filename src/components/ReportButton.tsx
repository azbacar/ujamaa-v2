import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ReportButtonProps {
  contentType: string;
  contentId: string;
}

const REASONS = [
  'Contenu inapproprié',
  'Informations incorrectes',
  'Spam ou publicité abusive',
  'Contenu offensant',
  'Autre',
];

export default function ReportButton({ contentType, contentId }: ReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) { toast.error('Connectez-vous pour signaler'); return; }
    if (!reason) { toast.error('Sélectionnez une raison'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('reports').insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        reason,
        details,
      });
      if (error) throw error;
      toast.success('Signalement envoyé');
      setOpen(false);
      setReason('');
      setDetails('');
    } catch {
      toast.error('Erreur lors du signalement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => user ? setOpen(true) : toast.error('Connectez-vous pour signaler')}>
        <Flag className="h-4 w-4 mr-1" /> Signaler
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler ce contenu</DialogTitle>
            <DialogDescription>Indiquez la raison du signalement</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Raison</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Détails (optionnel)</Label>
              <Textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Décrivez le problème..." rows={3} />
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? 'Envoi...' : 'Envoyer le signalement'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
