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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Handshake, Banknote, Users, ShieldCheck, Crown, Loader2, Plus, Receipt, Phone, Mail,
  MapPin, Wallet, Building2, CheckCircle2, Clock, XCircle, Lock,
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import {
  useMyPartnerAccount, usePartnerSettings, usePartnerTransactions, usePartnerDeposits,
  computeCommission, computeDepositSplit,
} from '@/hooks/usePartner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageSEO } from '@/hooks/usePageSEO';
import { logger } from '@/lib/logger';
import { authPath } from '@/lib/authRedirect';
import PartnerKycSection from '@/components/PartnerKycSection';

const ISLANDS = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];
const ALL_METHODS = [
  { id: 'cash', label: '💵 Espèces' },
  { id: 'bank_transfer', label: '🏦 Virement' },
  { id: 'mobile_money', label: '📱 Mobile Money' },
];

export default function PartnerPage() {
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { account, loading: accountLoading, refresh: refreshAccount } = useMyPartnerAccount();
  const { settings } = usePartnerSettings();
  const { transactions, refresh: refreshTx } = usePartnerTransactions(account?.id);
  const { deposits, refresh: refreshDeposits } = usePartnerDeposits(account?.id);

  const [collectForm, setCollectForm] = useState({
    clientEmail: '', clientPhone: '', amount: '', reference: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [depositForm, setDepositForm] = useState({
    total: '', method: 'cash' as 'cash' | 'bank_transfer' | 'mobile_money', reference: '', notes: '',
  });
  const [depositing, setDepositing] = useState(false);

  const [profileForm, setProfileForm] = useState({
    business_name: '', contact_phone: '', address: '', city: '', island: '',
    opening_hours: '', is_visible_on_map: true,
    accepted_methods: ['cash', 'bank_transfer'] as string[],
    latitude: null as number | null, longitude: null as number | null,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [locating, setLocating] = useState(false);

  // Initialize profileForm when account loads
  if (account && !profileForm.business_name && account.business_name) {
    setProfileForm({
      business_name: account.business_name,
      contact_phone: account.contact_phone || '',
      address: account.address || '',
      city: account.city || '',
      island: account.island || '',
      opening_hours: account.opening_hours || '',
      is_visible_on_map: account.is_visible_on_map ?? true,
      accepted_methods: account.accepted_methods || ['cash', 'bank_transfer'],
      latitude: account.latitude ?? null,
      longitude: account.longitude ?? null,
    });
  }

  usePageSEO({
    title: 'Portail Concessionnaires Partenaires',
    description: 'Devenez concessionnaire partenaire UJAMAA : encaissez les abonnements Pro de vos clients en cash, déposez à AZZHY et gardez 2 % de commission sur chaque dépôt.',
    keywords: 'concessionnaire UJAMAA, partenaire Comores, commission abonnement, AZZHY dépôt, mobile money cash, distributeur Pro',
    canonicalPath: '/partener',
  });

  const totalCollected = transactions.reduce((s, t) => s + (Number(t.amount_collected) || 0), 0);
  const totalCommission = transactions.reduce((s, t) => s + (Number(t.commission_amount) || 0), 0);
  const totalDeposited = deposits
    .filter(d => d.status === 'confirmed')
    .reduce((s, d) => s + Number(d.net_deposited || 0), 0);
  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  // Solde dû à AZZHY = total collecté en cash - net déjà déposé/confirmé - net en attente de confirmation
  const pendingNet = pendingDeposits.reduce((s, d) => s + Number(d.net_deposited || 0), 0);
  const owedToAzzhy = Math.max(0, totalCollected - totalDeposited - pendingNet - totalCommission);

  const handleCollect = async () => {
    if (!account || !settings) return;
    const email = collectForm.clientEmail.trim().toLowerCase();
    const phone = collectForm.clientPhone.trim();
    const amount = parseFloat(collectForm.amount);
    if (!email && !phone) { toast.error('Email ou téléphone du client requis'); return; }
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return; }

    setSubmitting(true);
    try {
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

  const handleDeposit = async () => {
    if (!account || !settings) return;
    const total = parseFloat(depositForm.total);
    if (!total || total <= 0) { toast.error('Montant total à déposer invalide'); return; }
    if (!depositForm.reference.trim()) { toast.error('Référence du dépôt requise (n° reçu / virement)'); return; }
    setDepositing(true);
    try {
      const split = computeDepositSplit(total, settings);
      const { error } = await supabase.from('partner_deposits').insert({
        partner_id: account.id,
        total_collected: total,
        commission_rate: split.commissionRate,
        commission_amount: split.commissionAmount,
        net_deposited: split.netDeposited,
        currency: settings.currency,
        deposit_method: depositForm.method,
        reference: depositForm.reference.trim(),
        notes: depositForm.notes.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
      toast.success(`✅ Dépôt enregistré. Commission retenue : ${split.commissionAmount} ${settings.currency} (${split.commissionRate}%)`);
      setDepositForm({ total: '', method: 'cash', reference: '', notes: '' });
      refreshDeposits();
    } catch (e: any) {
      logger.error('partner deposit failed', e);
      toast.error(e?.message || 'Erreur lors de l\'enregistrement du dépôt');
    } finally {
      setDepositing(false);
    }
  };

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) { toast.error('Géolocalisation indisponible'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfileForm({
          ...profileForm,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        toast.success(`📍 Position capturée (précision ${Math.round(pos.coords.accuracy)} m)`);
        setLocating(false);
      },
      () => { toast.error('Impossible de récupérer la position'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSaveProfile = async () => {
    if (!account) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('partner_accounts')
        .update({
          business_name: profileForm.business_name.trim(),
          contact_phone: profileForm.contact_phone.trim() || null,
          address: profileForm.address.trim() || null,
          city: profileForm.city.trim() || null,
          island: profileForm.island || null,
          opening_hours: profileForm.opening_hours.trim() || null,
          is_visible_on_map: profileForm.is_visible_on_map,
          accepted_methods: profileForm.accepted_methods,
          latitude: profileForm.latitude,
          longitude: profileForm.longitude,
        })
        .eq('id', account.id);
      if (error) throw error;
      toast.success('Profil enregistré ✅');
      refreshAccount();
    } catch (e: any) {
      logger.error('save partner profile failed', e);
      toast.error(e?.message || 'Erreur');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleMethod = (id: string) => {
    setProfileForm({
      ...profileForm,
      accepted_methods: profileForm.accepted_methods.includes(id)
        ? profileForm.accepted_methods.filter(m => m !== id)
        : [...profileForm.accepted_methods, id],
    });
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
                Encaissez les abonnements Pro de vos clients en cash, reversez à AZZHY
                et gardez <strong>2 % de commission</strong> sur chaque dépôt.
              </p>
            </div>
          </section>

          <section className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" /> 2 % par dépôt</CardTitle></CardHeader>
                <CardContent>Pour chaque dépôt cash ou virement effectué chez AZZHY, vous gardez automatiquement 2 % de commission.</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-600" /> Visibilité sur la carte</CardTitle></CardHeader>
                <CardContent>Votre point de vente apparaît sur la carte UJAMAA, accessible depuis le mode de paiement.</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Traçabilité totale</CardTitle></CardHeader>
                <CardContent>Tableau de bord, historique des encaissements, suivi du solde dû à AZZHY et des dépôts confirmés.</CardContent>
              </Card>
            </div>

            <div className="mt-12 max-w-2xl mx-auto text-center">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-sm">
                  <strong>Comment devenir partenaire ?</strong><br />
                  Les comptes concessionnaires sont créés sur invitation par notre équipe administrative.
                  Contactez-nous pour discuter d'un partenariat.
                </AlertDescription>
              </Alert>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button asChild size="lg"><a href="tel:+2697332122"><Phone className="h-4 w-4 mr-2" />+269 733 2122</a></Button>
                <Button asChild size="lg" variant="outline"><a href="mailto:contact@ujamaan.com"><Mail className="h-4 w-4 mr-2" />contact@ujamaan.com</a></Button>
              </div>
              {!user && (
                <p className="text-sm text-muted-foreground mt-6">
                  Vous êtes déjà partenaire ?{' '}
                  <button onClick={() => navigate(authPath())} className="text-emerald-600 underline font-medium">
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

  const depositRate = settings?.azzhy_deposit_commission_rate ?? 2;
  const depositPreview = depositForm.total
    ? computeDepositSplit(parseFloat(depositForm.total) || 0, settings)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Handshake className="h-7 w-7 text-emerald-600" /> {account!.business_name}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <ShieldCheck className="h-3 w-3 mr-1" /> Concessionnaire actif
            </Badge>
            {account!.is_visible_on_map && (
              <Badge variant="outline" className="border-ocean-200 text-ocean-700">
                <MapPin className="h-3 w-3 mr-1" /> Visible sur la carte
              </Badge>
            )}
            {account!.kyc_status === 'approved' ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> KYC validé</Badge>
            ) : account!.kyc_status === 'submitted' ? (
              <Badge className="bg-ocean-100 text-ocean-700 border-ocean-200"><Clock className="h-3 w-3 mr-1" /> KYC en examen</Badge>
            ) : account!.kyc_status === 'rejected' ? (
              <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> KYC rejeté</Badge>
            ) : (
              <Badge variant="outline" className="border-amber-300 text-amber-700"><Lock className="h-3 w-3 mr-1" /> KYC requis</Badge>
            )}
            {account!.island && <span className="text-sm text-muted-foreground">📍 {account!.city || ''} {account!.island}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Encaissements</p>
              <p className="text-xl sm:text-2xl font-bold">{transactions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Total collecté</p>
              <p className="text-xl sm:text-2xl font-bold">{totalCollected.toLocaleString('fr-FR')} {settings?.currency || 'FC'}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <p className="text-xs uppercase text-emerald-700 font-medium">Commissions cumulées</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-700">{totalCommission.toLocaleString('fr-FR')} {settings?.currency || 'FC'}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <p className="text-xs uppercase text-amber-800 font-medium">Solde dû à AZZHY</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-800">{owedToAzzhy.toLocaleString('fr-FR')} {settings?.currency || 'FC'}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="collect">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="collect"><Plus className="h-4 w-4 mr-1" /> Encaisser</TabsTrigger>
            <TabsTrigger value="deposit"><Wallet className="h-4 w-4 mr-1" /> Dépôts AZZHY</TabsTrigger>
            <TabsTrigger value="history"><Receipt className="h-4 w-4 mr-1" /> Historique</TabsTrigger>
            <TabsTrigger value="profile"><Building2 className="h-4 w-4 mr-1" /> Profil</TabsTrigger>
          </TabsList>

          {/* ENCAISSER */}
          <TabsContent value="collect">
            <Card>
              <CardHeader>
                <CardTitle>Encaisser un abonnement Pro</CardTitle>
                <CardDescription>
                  Le client doit avoir un compte UJAMAA. Tarif : <strong>{settings?.pro_plan_price || 990} {settings?.currency}</strong>.
                  Votre commission par encaissement : <strong className="text-emerald-700">
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
                    type="email" placeholder="client@example.com"
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
                      placeholder={String(settings?.pro_plan_price || 990)}
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
                  ✅ Le client sera promu Pro dès la confirmation. Une notification lui sera envoyée.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEPOTS AZZHY */}
          <TabsContent value="deposit" className="space-y-4">
            <Alert className="border-ocean-200 bg-ocean-50">
              <AlertDescription className="text-sm">
                💡 <strong>Comment ça marche :</strong> Vous reversez à AZZHY le total cash collecté, soit par
                <strong> dépôt en espèces </strong> à nos bureaux, soit par <strong>virement bancaire</strong>.
                AZZHY retient automatiquement <strong>{depositRate} %</strong> de commission qui vous revient.
                Le dépôt est validé sous 24h.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Nouveau dépôt à AZZHY</CardTitle>
                <CardDescription>
                  Solde estimé à reverser : <strong className="text-amber-700">{owedToAzzhy.toLocaleString('fr-FR')} {settings?.currency || 'FC'}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Montant total à reverser ({settings?.currency || 'FC'}) *</Label>
                    <Input
                      type="number" placeholder="Ex: 50000"
                      value={depositForm.total}
                      onChange={e => setDepositForm({ ...depositForm, total: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Mode de dépôt *</Label>
                    <Select value={depositForm.method} onValueChange={(v: any) => setDepositForm({ ...depositForm, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Espèces (au bureau AZZHY)</SelectItem>
                        <SelectItem value="bank_transfer">🏦 Virement bancaire (EXIM BANK)</SelectItem>
                        <SelectItem value="mobile_money">📱 Mobile Money (Mvola)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Référence (n° reçu / virement / transaction) *</Label>
                  <Input
                    placeholder="Ex: REC-2026-001 ou MP260407.1234.A56789"
                    value={depositForm.reference}
                    onChange={e => setDepositForm({ ...depositForm, reference: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    placeholder="Période couverte, remarques..."
                    value={depositForm.notes}
                    onChange={e => setDepositForm({ ...depositForm, notes: e.target.value })}
                  />
                </div>

                {depositPreview && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Total reversé</p>
                      <p className="font-bold">{(parseFloat(depositForm.total) || 0).toLocaleString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700">Votre commission ({depositPreview.commissionRate}%)</p>
                      <p className="font-bold text-emerald-700">+{depositPreview.commissionAmount.toLocaleString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ocean-700">Net à AZZHY</p>
                      <p className="font-bold text-ocean-700">{depositPreview.netDeposited.toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                )}

                <Button onClick={handleDeposit} disabled={depositing} className="w-full bg-ocean-600 hover:bg-ocean-700">
                  {depositing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
                  Soumettre le dépôt
                </Button>
              </CardContent>
            </Card>

            {/* Historique dépôts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique de vos dépôts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deposits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun dépôt pour l'instant</p>
                ) : deposits.map(d => (
                  <div key={d.id} className="flex justify-between items-center flex-wrap gap-2 p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {d.deposit_method === 'cash' ? '💵 Espèces' : d.deposit_method === 'bank_transfer' ? '🏦 Virement' : '📱 Mobile Money'}
                        {' '}— {Number(d.total_collected).toLocaleString('fr-FR')} {d.currency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleString('fr-FR')} · Réf : {d.reference || '—'}
                      </p>
                      <p className="text-xs">
                        Commission gardée : <strong className="text-emerald-700">{Number(d.commission_amount).toLocaleString('fr-FR')} {d.currency}</strong>
                        {' '}· Net AZZHY : <strong>{Number(d.net_deposited).toLocaleString('fr-FR')} {d.currency}</strong>
                      </p>
                    </div>
                    {d.status === 'confirmed' ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Confirmé</Badge>
                    ) : d.status === 'rejected' ? (
                      <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejeté</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-300 text-amber-700"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORIQUE encaissements */}
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

          {/* PROFIL + GEOLOC */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Mon point de vente</CardTitle>
                <CardDescription>
                  Ces informations apparaissent sur la carte UJAMAA et dans le mode de paiement
                  pour que les clients puissent venir payer chez vous.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Nom commercial *</Label>
                    <Input
                      value={profileForm.business_name}
                      onChange={e => setProfileForm({ ...profileForm, business_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Téléphone public</Label>
                    <Input
                      placeholder="+269 XXX XX XX"
                      value={profileForm.contact_phone}
                      onChange={e => setProfileForm({ ...profileForm, contact_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Île</Label>
                    <Select value={profileForm.island} onValueChange={(v) => setProfileForm({ ...profileForm, island: v })}>
                      <SelectTrigger><SelectValue placeholder="Île" /></SelectTrigger>
                      <SelectContent>{ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ville</Label>
                    <Input
                      value={profileForm.city}
                      onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Adresse précise</Label>
                  <Input
                    placeholder="Rue, quartier, point de repère"
                    value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Horaires d'ouverture</Label>
                  <Input
                    placeholder="Ex: Lun-Sam 8h-17h"
                    value={profileForm.opening_hours}
                    onChange={e => setProfileForm({ ...profileForm, opening_hours: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Modes de paiement acceptés</Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_METHODS.map(m => {
                      const active = profileForm.accepted_methods.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMethod(m.id)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition ${
                            active
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                              : 'bg-muted border-border text-muted-foreground'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Géoloc */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /> Position GPS</Label>
                    <Button size="sm" variant="outline" onClick={handleLocateMe} disabled={locating}>
                      {locating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                      Capturer ma position
                    </Button>
                  </div>
                  {profileForm.latitude && profileForm.longitude ? (
                    <p className="text-xs text-muted-foreground">
                      📍 {profileForm.latitude.toFixed(6)}, {profileForm.longitude.toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucune position enregistrée</p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <Label className="font-medium">Visible sur la carte des paiements</Label>
                    <p className="text-xs text-muted-foreground">
                      Les utilisateurs pourront voir votre point de vente lorsqu'ils choisissent de payer en cash.
                    </p>
                  </div>
                  <Switch
                    checked={profileForm.is_visible_on_map}
                    onCheckedChange={(v) => setProfileForm({ ...profileForm, is_visible_on_map: v })}
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                  {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Enregistrer mon profil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
