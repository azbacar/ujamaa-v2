import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Crown, CreditCard, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SubscriptionRequest {
  id: string;
  user_id: string;
  plan: string;
  payment_method: string;
  payment_reference: string | null;
  amount: number;
  currency: string;
  status: string;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  username?: string;
  email?: string;
}

export default function ProSubscriptionsSection() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pro_subscription_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user info for each request
      const enriched = await Promise.all(
        (data || []).map(async (req) => {
          const { data: userData } = await supabase
            .from('users')
            .select('username, email')
            .eq('id', req.user_id)
            .maybeSingle();
          return { ...req, username: userData?.username, email: userData?.email };
        })
      );
      setRequests(enriched);
    } catch {
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('pro_subscription_requests')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[id] || null,
        })
        .eq('id', id);

      if (error) throw error;

      // If approved, upgrade user account_type to pro
      if (status === 'approved') {
        const request = requests.find(r => r.id === id);
        if (request) {
          await supabase.from('users').update({ account_type: 'pro' }).eq('id', request.user_id);
          // Also ensure annonceur role
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', request.user_id)
            .eq('role', 'annonceur')
            .maybeSingle();
          if (!existingRole) {
            await supabase.from('user_roles').upsert({
              user_id: request.user_id,
              role: 'annonceur' as any,
              assigned_by: user.id,
            });
          }
        }
      }

      await supabase.rpc('log_admin_action', {
        _action_type: 'pro_subscription_review',
        _target_type: 'pro_subscription_request',
        _target_id: id,
        _description: `Demande ${status === 'approved' ? 'approuvée' : 'rejetée'}`,
      });

      toast.success(status === 'approved' ? 'Abonnement approuvé !' : 'Demande rejetée');
      fetchRequests();
    } catch {
      toast.error('Erreur lors du traitement');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'stripe': return '💳 Stripe';
      case 'mvola': return '📱 Mvola';
      case 'bank_transfer': return '🏦 Virement';
      default: return method;
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6 p-6">
      <Card className="border-amber-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-amber-600 flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Gestion des Abonnements Pro
          </CardTitle>
          <CardDescription>
            {pending.length} demande(s) en attente · {requests.length} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg bg-amber-50">
              <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
              <div className="text-sm text-slate-600">En attente</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'approved').length}</div>
              <div className="text-sm text-slate-600">Approuvées</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600">{requests.filter(r => r.status === 'rejected').length}</div>
              <div className="text-sm text-slate-600">Rejetées</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> En attente ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Traitées ({processed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : pending.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Aucune demande en attente</CardContent></Card>
          ) : (
            pending.map(req => (
              <Card key={req.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{req.username || 'Utilisateur'}</span>
                        <span className="text-sm text-muted-foreground">{req.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Badge variant="outline">{req.plan}</Badge>
                        <span>{getPaymentMethodLabel(req.payment_method)}</span>
                        <span className="font-semibold">{req.amount.toLocaleString()} {req.currency}</span>
                      </div>
                      {req.payment_reference && (
                        <p className="text-xs text-muted-foreground">Réf: {req.payment_reference}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  <Textarea
                    placeholder="Notes de révision (optionnel)..."
                    value={reviewNotes[req.id] || ''}
                    onChange={(e) => setReviewNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAction(req.id, 'approved')} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-1" /> Approuver
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(req.id, 'rejected')}>
                      <XCircle className="h-4 w-4 mr-1" /> Rejeter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processed.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Aucune demande traitée</CardContent></Card>
          ) : (
            processed.map(req => (
              <Card key={req.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{req.username || 'Utilisateur'}</span>
                        <span className="text-sm text-muted-foreground">{req.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Badge variant="outline">{req.plan}</Badge>
                        <span>{getPaymentMethodLabel(req.payment_method)}</span>
                        <span className="font-semibold">{req.amount.toLocaleString()} {req.currency}</span>
                      </div>
                      {req.review_notes && <p className="text-sm text-muted-foreground italic">"{req.review_notes}"</p>}
                      <p className="text-xs text-muted-foreground">
                        Traité le {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
