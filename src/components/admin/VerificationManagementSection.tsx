import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BadgeCheck, CheckCircle, XCircle, Clock, FileText, ExternalLink } from 'lucide-react';

interface VerificationRequest {
  id: string;
  user_id: string;
  type: string;
  business_name: string | null;
  document_type: string;
  document_url: string | null;
  additional_info: string | null;
  status: string;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  username?: string;
}

export default function VerificationManagementSection() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { toast.error('Erreur de chargement'); setLoading(false); return; }

    // Enrich with usernames
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: usernames } = await supabase.rpc('get_public_usernames', { _user_ids: userIds });
      const usernameMap = new Map((usernames || []).map((u: any) => [u.id, u.username]));
      const enriched = data.map(r => ({ ...r, username: usernameMap.get(r.user_id) || 'Inconnu' }));
      setRequests(enriched);
    } else {
      setRequests([]);
    }
    setLoading(false);
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    try {
      const req = requests.find(r => r.id === id);
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[id] || null,
        })
        .eq('id', id);
      if (error) throw error;

      // If approved, add verified privilege
      if (status === 'approved' && req) {
        await supabase.from('announcer_privileges').insert({
          user_id: req.user_id,
          privilege: 'verified',
          granted_by: user.id,
        });

        // Send notification
        await supabase.from('notifications').insert({
          user_id: req.user_id,
          title: '✅ Profil vérifié',
          message: `Votre demande de vérification "${req.type}" a été approuvée. Vous êtes maintenant vérifié !`,
          type: 'info',
        });
      } else if (status === 'rejected' && req) {
        await supabase.from('notifications').insert({
          user_id: req.user_id,
          title: '❌ Vérification rejetée',
          message: `Votre demande de vérification a été rejetée.${reviewNotes[id] ? ` Motif : ${reviewNotes[id]}` : ''}`,
          type: 'error',
        });
      }

      toast.success(`Demande ${status === 'approved' ? 'approuvée' : 'rejetée'}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
  };

  const getDocUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('verification-documents').getPublicUrl(path);
    return data?.publicUrl;
  };

  const typeLabels: Record<string, string> = {
    freelancer: 'Freelancer',
    announcer: 'Annonceur',
    project_carrier: 'Porteur de projet',
  };

  const docTypeLabels: Record<string, string> = {
    cin: 'CIN',
    passport: 'Passeport',
    rccm: 'RCCM',
    nif: 'NIF',
    other: 'Autre',
  };

  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BadgeCheck className="h-6 w-6" /> Gestion des vérifications
        </h2>
        <Badge variant="secondary">{pending.length} en attente</Badge>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : pending.length === 0 && processed.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BadgeCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Aucune demande de vérification</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                En attente ({pending.length})
              </h3>
              {pending.map(req => (
                <Card key={req.id} className="border-amber-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{req.username}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{typeLabels[req.type] || req.type}</Badge>
                          <Badge variant="secondary">{docTypeLabels[req.document_type] || req.document_type}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">{new Date(req.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    {req.business_name && (
                      <p className="text-sm"><span className="text-muted-foreground">Entreprise :</span> {req.business_name}</p>
                    )}
                    {req.additional_info && (
                      <p className="text-sm text-muted-foreground italic">"{req.additional_info}"</p>
                    )}
                    {req.document_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={getDocUrl(req.document_url) || '#'} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-1" /> Voir le document <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                    <div className="flex gap-2 items-end">
                      <Input
                        placeholder="Notes de révision (optionnel)"
                        value={reviewNotes[req.id] || ''}
                        onChange={e => setReviewNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                        className="flex-1"
                      />
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleReview(req.id, 'approved')}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approuver
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReview(req.id, 'rejected')}>
                        <XCircle className="h-4 w-4 mr-1" /> Rejeter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {processed.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Traitées ({processed.length})
              </h3>
              {processed.slice(0, 20).map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{req.username}</p>
                    <div className="flex gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{typeLabels[req.type] || req.type}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <Badge variant={req.status === 'approved' ? 'default' : 'destructive'}>
                    {req.status === 'approved' ? '✅ Approuvé' : '❌ Rejeté'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
