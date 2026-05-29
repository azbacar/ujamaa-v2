import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, TrendingUp, Calendar, ArrowLeft, Receipt, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { useLanguage } from '@/components/LanguageProvider';



type StatusTone = 'success' | 'pending' | 'error' | 'info';
function statusBadge(label: string, tone: StatusTone) {
  const map: Record<StatusTone, string> = {
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
    pending: 'bg-amber-500/10 text-amber-700 border-amber-300',
    error: 'bg-rose-500/10 text-rose-700 border-rose-300',
    info: 'bg-sky-500/10 text-sky-700 border-sky-300',
  };
  return <Badge variant="outline" className={map[tone]}>{label}</Badge>;
}

function proStatusBadge(s: string | null | undefined) {
  switch (s) {
    case 'approved': return statusBadge('✅ Approuvé', 'success');
    case 'pending':  return statusBadge('⏳ En attente', 'pending');
    case 'rejected': return statusBadge('❌ Rejeté', 'error');
    default: return statusBadge(s || '—', 'info');
  }
}
function investStatusBadge(s: string | null | undefined) {
  switch (s) {
    case 'confirmed': return statusBadge('✅ Confirmé', 'success');
    case 'pending':   return statusBadge('⏳ En attente', 'pending');
    case 'cancelled': return statusBadge('❌ Annulé', 'error');
    case 'refunded':  return statusBadge('↩️ Remboursé', 'info');
    default: return statusBadge(s || '—', 'info');
  }
}
function eventStatusBadge(s: string | null | undefined) {
  switch (s) {
    case 'paid':    return statusBadge('✅ Payé', 'success');
    case 'pending': return statusBadge('⏳ En attente', 'pending');
    case 'failed':  return statusBadge('❌ Échec', 'error');
    case 'refunded':return statusBadge('↩️ Remboursé', 'info');
    default: return statusBadge(s || '—', 'info');
  }
}

const fmt = (n: number | null | undefined, cur: string | null | undefined) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(n || 0))} ${cur || 'KMF'}`;
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function PaymentsHistoryPage() {
  const { user, loading } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth?redirect=/mes-paiements', { replace: true });
  }, [user, loading, navigate]);

  const pro = useQuery({
    queryKey: ['my-pro-payments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pro_subscription_requests')
        .select('id, plan, amount, final_amount, currency, status, payment_method, payment_reference, created_at, reviewed_at, review_notes')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const invest = useQuery({
    queryKey: ['my-invest-payments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_investments')
        .select('id, project_id, amount, currency, status, payment_method, payment_reference, message, created_at, investments:project_id(title)')
        .eq('investor_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const events = useQuery({
    queryKey: ['my-event-payments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id, event_id, payment_status, ticket_code, additional_info, created_at, events:event_id(title)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const counts = useMemo(() => ({
    pro: pro.data?.length || 0,
    invest: invest.data?.length || 0,
    events: events.data?.length || 0,
  }), [pro.data, invest.data, events.data]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/profile"><ArrowLeft className="h-4 w-4 mr-1" /> Profil</Link>
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mes paiements</h1>
            <p className="text-sm text-muted-foreground">Historique de tous vos paiements et statuts (Pro, investissements, événements).</p>
          </div>
        </div>

        <Tabs defaultValue="pro" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="pro"><Crown className="h-4 w-4 mr-1" /> Pro ({counts.pro})</TabsTrigger>
            <TabsTrigger value="invest"><TrendingUp className="h-4 w-4 mr-1" /> Invest ({counts.invest})</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-1" /> Événements ({counts.events})</TabsTrigger>
          </TabsList>

          {/* PRO */}
          <TabsContent value="pro" className="space-y-3">
            {pro.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
            {!pro.isLoading && counts.pro === 0 && (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucun paiement Pro pour le moment. <Link to="/pro" className="text-primary underline">Passer Pro</Link>
              </CardContent></Card>
            )}
            {pro.data?.map(p => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Abonnement {p.plan?.toUpperCase() || 'PRO'}</CardTitle>
                    {proStatusBadge(p.status)}
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Montant :</span> <strong>{fmt(p.final_amount ?? p.amount, p.currency)}</strong></p>
                  <p><span className="text-muted-foreground">Méthode :</span> {p.payment_method || '—'}</p>
                  {p.payment_reference && <p className="text-xs text-muted-foreground break-all">Réf : {p.payment_reference}</p>}
                  <p className="text-xs text-muted-foreground">Demandé le {fmtDate(p.created_at)}{p.reviewed_at ? ` • Traité le ${fmtDate(p.reviewed_at)}` : ''}</p>
                  {p.review_notes && <p className="text-xs mt-1 italic">{p.review_notes}</p>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* INVEST */}
          <TabsContent value="invest" className="space-y-3">
            {invest.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
            {!invest.isLoading && counts.invest === 0 && (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucun investissement pour le moment. <Link to="/investissement" className="text-primary underline">Découvrir les projets</Link>
              </CardContent></Card>
            )}
            {invest.data?.map((i: any) => (
              <Card key={i.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      <Link to={`/investissement/${i.project_id}`} className="hover:underline">
                        {i.investments?.title || 'Projet'}
                      </Link>
                    </CardTitle>
                    {investStatusBadge(i.status)}
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Montant :</span> <strong>{fmt(i.amount, i.currency)}</strong></p>
                  <p><span className="text-muted-foreground">Méthode :</span> {i.payment_method || '—'}</p>
                  {i.payment_reference && <p className="text-xs text-muted-foreground break-all">Réf : {i.payment_reference}</p>}
                  {i.message && <p className="text-xs italic">« {i.message} »</p>}
                  <p className="text-xs text-muted-foreground">Envoyé le {fmtDate(i.created_at)}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* EVENTS */}
          <TabsContent value="events" className="space-y-3">
            {events.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
            {!events.isLoading && counts.events === 0 && (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucune inscription événement. <Link to="/evenements" className="text-primary underline">Voir les événements</Link>
              </CardContent></Card>
            )}
            {events.data?.map((e: any) => {
              const info = e.additional_info || {};
              return (
                <Card key={e.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">
                        <Link to={`/evenements/${e.event_id}`} className="hover:underline">
                          {e.events?.title || 'Événement'}
                        </Link>
                      </CardTitle>
                      {eventStatusBadge(e.payment_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    {info.amount && <p><span className="text-muted-foreground">Montant :</span> <strong>{fmt(info.amount, info.currency)}</strong></p>}
                    {info.payment_method && <p><span className="text-muted-foreground">Méthode :</span> {info.payment_method}</p>}
                    {e.ticket_code && <p className="text-xs"><span className="text-muted-foreground">Billet :</span> <code className="font-mono">{e.ticket_code}</code></p>}
                    {info.payment_reference && <p className="text-xs text-muted-foreground break-all">Réf : {info.payment_reference}</p>}
                    <p className="text-xs text-muted-foreground">Inscrit le {fmtDate(e.created_at)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
