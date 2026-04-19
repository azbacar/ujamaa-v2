import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Handshake, Banknote, TrendingUp, Users, ShieldCheck, Crown, Loader2, Plus, Receipt, Phone, Mail } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { useMyPartnerAccount, usePartnerSettings, usePartnerTransactions, computeCommission } from '@/hooks/usePartner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageSEO } from '@/hooks/usePageSEO';
import { logger } from '@/lib/logger';

export default function PartnerPage() {
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { account, loading: accountLoading, refresh: refreshAccount } = useMyPartnerAccount();
  const { settings } = usePartnerSettings();
  const { transactions, refresh: refreshTx } = usePartnerTransactions(account?.id);

  const [collectForm, setCollectForm] = useState({
    clientEmail: '', clientPhone: '', amount: '', reference: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  usePageSEO({
    title: 'Portail Concessionnaires Partenaires',
    description: 'Devenez concessionnaire partenaire UJAMAA et générez des revenus en encaissant les abonnements Pro de vos clients en cash. Commission attractive sur chaque renouvellement.',
    keywords: 'concessionnaire UJAMAA, partenaire Comores, commission abonnement, mobile money cash, distributeur Pro',
    canonicalPath: '/partener',
  });

  const totalCollected = transactions.reduce((s, t) => s + (Number(t.amount_collected) || 0), 0);
  const totalCommission = transactions.reduce((s, t) => s + (Number(t.commission_amount) || 0), 0);

  const handleCollect = async () => {
    if (!account || !settings) return;
    const email = collectForm.clientEmail.trim().toLowerCase();
    const phone = collectForm.clientPhone.trim();
    const amount = parseFloat(collectForm.amount);
    if (!email && !phone) { toast.error('Email ou téléphone du client requis'); return; }
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return; }

    setSubmitting(true);
    try {
      // Find client by email
      let clientId: string | null = null;
      if (email) {
        const { data: u } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
        clientId = (u as any)?.id || null;
      }
      if (!clientId) {
        toast.error('Client introuvable. Demandez-lui de créer un compte UJAMAA d\'abord.');
        setSubmitting(false);
        return;
      }

      const commission = computeCommission(amount, settings);

      const { error } = await supabase.from('partner_transactions').insert({
        partner_id: account.id,
        client_user_id: clientId,
        client_email: email || null,
        client_phone: phone || null,
        plan: 'pro_monthly',
        amount_collected: amount,
        commission_amount: commission,
        currency: settings.currency,
        reference: collectForm.reference || null,
        notes: collectForm.notes || null,
        status: 'completed',
      });
      if (error) throw error;

      toast.success(`✅ Encaissement enregistré. Commission : ${commission} ${settings.currency}`);
      setCollectForm({ clientEmail: '', clientPhone: '', amount: '', reference: '', notes: '' });
      refreshTx();
    } catch (e: any) {
      logger.error('partner collect failed', e);
      toast.error(e?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Public landing (non-partner / not logged in) ----------
  if (!user || (!accountLoading && !account)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <main className="flex-1">
          <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-ocean-700 text-white py-16 sm:py-24">
            <div className="container mx-auto px-4 text-center">
              <Handshake className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl sm:text-5xl font-bold mb-4">Devenez Concessionnaire UJAMAA</h1>
              <p className="text-lg sm:text-xl max-w-2xl mx-auto opacity-95">
                Générez des revenus stables en encaissant les abonnements UJAMAA Pro de vos clients en cash.
                Une commission vous est versée à chaque renouvellement.
              </p>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" /> Revenus récurrents</CardTitle></CardHeader>
                <CardContent>Touchez une commission sur chaque abonnement Pro encaissé chez vous, à chaque mois.</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /> Vos clients fidélisés</CardTitle></CardHeader>
                <CardContent>Vos clients peuvent renouveler leur Pro chez vous en cash, sans Mobile Money ni carte.</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Plateforme sérieuse</CardTitle></CardHeader>
                <CardContent>Tableau de bord dédié, traçabilité totale des encaissements et commissions cumulées.</CardContent>
              </Card>
            </div>

            <div className="mt-12 max-w-2xl mx-auto text-center">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-sm">
                  <strong>Comment devenir partenaire ?</strong><br />
                  Les comptes concessionnaires sont créés sur invitation par notre équipe administrative
                  pour garantir la qualité du réseau. Contactez-nous pour discuter d'un partenariat.
                </AlertDescription>
              </Alert>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button asChild size="lg"><a href="tel:+2697332122"><Phone className="h-4 w-4 mr-2" />+269 733 2122</a></Button>
                <Button asChild size="lg" variant="outline"><a href="mailto:contact@ujamaan.com"><Mail className="h-4 w-4 mr-2" />contact@ujamaan.com</a></Button>
              </div>
              {!user && (
                <p className="text-sm text-muted-foreground mt-6">
                  Vous êtes déjà partenaire ?{' '}
                  <button onClick={() => navigate('/auth')} className="text-emerald-600 underline font-medium">
                    Connectez-vous
                  </button>
                </p>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  // ---------- Partner Dashboard ----------
  if (accountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (account!.status === 'suspended') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertDescription>
              Votre compte concessionnaire est actuellement <strong>suspendu</strong>.
              Veuillez contacter l'administration pour le réactiver.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Handshake className="h-7 w-7 text-emerald-600" /> {account!.business_name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <ShieldCheck className="h-3 w-3 mr-1" /> Concessionnaire actif
            </Badge>
            {account!.island && <span className="text-sm text-muted-foreground">📍 {account!.city || ''} {account!.island}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase text-muted-foreground">Encaissements</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase text-muted-foreground">Total collecté</p>
              <p className="text-2xl font-bold">{totalCollected.toLocaleString('fr-FR')} {settings?.currency || 'FC'}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-5">
              <p className="text-xs uppercase text-emerald-700 font-medium">Commissions cumulées</p>
              <p className="text-2xl font-bold text-emerald-700">{totalCommission.toLocaleString('fr-FR')} {settings?.currency || 'FC'}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="collect">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="collect"><Plus className="h-4 w-4 mr-1" /> Encaisser</TabsTrigger>
            <TabsTrigger value="history"><Receipt className="h-4 w-4 mr-1" /> Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="collect">
            <Card>
              <CardHeader>
                <CardTitle>Encaisser un abonnement Pro</CardTitle>
                <CardDescription>
                  Le client doit avoir un compte UJAMAA. Tarif : <strong>{settings?.pro_plan_price || 5000} {settings?.currency}</strong>.
                  Votre commission : <strong className="text-emerald-700">
                    {settings?.commission_type === 'percentage'
                      ? `${settings.commission_value}%`
                      : `${settings?.commission_value} ${settings?.currency}`}
                  </strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email du client *</Label>
                  <Input
                    type="email"
                    placeholder="client@example.com"
                    value={collectForm.clientEmail}
                    onChange={e => setCollectForm({ ...collectForm, clientEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Téléphone du client (optionnel)</Label>
                  <Input
                    placeholder="+269 XXX XX XX"
                    value={collectForm.clientPhone}
                    onChange={e => setCollectForm({ ...collectForm, clientPhone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Montant encaissé ({settings?.currency || 'FC'}) *</Label>
                    <Input
                      type="number"
                      placeholder={String(settings?.pro_plan_price || 5000)}
                      value={collectForm.amount}
                      onChange={e => setCollectForm({ ...collectForm, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Référence</Label>
                    <Input
                      placeholder="N° reçu interne"
                      value={collectForm.reference}
                      onChange={e => setCollectForm({ ...collectForm, reference: e.target.value })}
                    />
                  </div>
                </div>
                {collectForm.amount && settings && (
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <AlertDescription>
                      💰 Commission calculée : <strong className="text-emerald-700">
                        {computeCommission(parseFloat(collectForm.amount) || 0, settings).toLocaleString('fr-FR')} {settings.currency}
                      </strong>
                    </AlertDescription>
                  </Alert>
                )}
                <Button onClick={handleCollect} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Crown className="h-4 w-4 mr-2" />}
                  Confirmer l'encaissement et activer Pro
                </Button>
                <p className="text-xs text-muted-foreground">
                  ✅ Le client sera automatiquement promu Pro dès la confirmation. Une notification lui sera envoyée.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {transactions.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun encaissement pour l'instant</CardContent></Card>
            ) : (
              transactions.map(tx => (
                <Card key={tx.id}>
                  <CardContent className="p-4 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <p className="font-medium">{tx.client_email || tx.client_phone}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString('fr-FR')}
                        {tx.reference && ` • Réf: ${tx.reference}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{Number(tx.amount_collected).toLocaleString('fr-FR')} {tx.currency}</p>
                      <p className="text-xs text-emerald-700">+{Number(tx.commission_amount).toLocaleString('fr-FR')} {tx.currency} commission</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
