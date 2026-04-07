import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Building2, FileText, Users, BarChart3, Plus, Send,
  CheckCircle, Clock, XCircle, Save, Trash2, Shield, Globe, Phone, Mail,
  UserCircle, Receipt, Calculator
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useEnterprise, EnterpriseProfile } from '@/hooks/useEnterprise';
import { useEnterpriseCRM } from '@/hooks/useEnterpriseCRM';
import { supabase } from '@/integrations/supabase/client';
import CRMClientsTab from '@/components/enterprise/CRMClientsTab';
import CRMInvoicesTab from '@/components/enterprise/CRMInvoicesTab';
import CRMAccountingTab from '@/components/enterprise/CRMAccountingTab';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';

const ISLANDS = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];
const SECTORS = [
  'Agriculture', 'Pêche', 'Commerce', 'BTP', 'Transport', 'Tourisme',
  'Éducation', 'Santé', 'Technologie', 'Services', 'Industrie', 'Autre'
];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-500' },
  accepted: { label: 'Acceptée', icon: CheckCircle, color: 'bg-green-500' },
  rejected: { label: 'Rejetée', icon: XCircle, color: 'bg-red-500' },
};

export default function EnterpriseDashboard() {
  usePageSEO({ title: 'Espace Entreprise — UJAMAA', description: 'Gérez votre profil entreprise, vos soumissions et vos collaborateurs' });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enterprise, submissions, members, loading, createEnterprise, updateEnterprise, submitTender, addMember, removeMember, refresh } = useEnterprise();

  if (loading) {
    return (
      <>
        <Header currentLanguage="fr" onLanguageChange={() => {}} />
        <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Chargement…</div></div>
        <Footer />
      </>
    );
  }

  if (!enterprise) {
    return (
      <>
        <Header currentLanguage="fr" onLanguageChange={() => {}} />
        <div className="container max-w-2xl mx-auto py-12 px-4">
          <EnterpriseRegistrationForm onCreated={refresh} userId={user?.id || ''} />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header currentLanguage="fr" onLanguageChange={() => {}} />
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        {/* Enterprise Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">
            {enterprise.logo_url ? (
              <img src={enterprise.logo_url} alt={enterprise.name} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{enterprise.name}</h1>
              {enterprise.is_verified ? (
                <Badge className="bg-blue-500 text-white gap-1"><CheckCircle className="h-3 w-3" /> Vérifiée</Badge>
              ) : (
                <Badge variant="secondary">En attente de vérification</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{enterprise.sector} • {enterprise.island || 'Non spécifié'}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Soumissions" value={submissions.length} />
          <StatCard icon={CheckCircle} label="Acceptées" value={submissions.filter(s => s.status === 'accepted').length} />
          <StatCard icon={Users} label="Collaborateurs" value={members.length} />
          <StatCard icon={Shield} label="Statut" value={enterprise.is_verified ? 'Vérifiée' : 'Non vérifiée'} />
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="w-full flex flex-wrap">
            <TabsTrigger value="profile" className="gap-1"><Building2 className="h-4 w-4" /> Profil</TabsTrigger>
            <TabsTrigger value="tenders" className="gap-1"><FileText className="h-4 w-4" /> Soumissions</TabsTrigger>
            <TabsTrigger value="team" className="gap-1"><Users className="h-4 w-4" /> Équipe</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-4 w-4" /> Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <EnterpriseProfileEditor enterprise={enterprise} onUpdate={updateEnterprise} />
          </TabsContent>

          <TabsContent value="tenders">
            <TenderSubmissionsTab submissions={submissions} onSubmit={submitTender} enterpriseId={enterprise.id} isVerified={enterprise.is_verified} />
          </TabsContent>

          <TabsContent value="team">
            <TeamTab members={members} onAdd={addMember} onRemove={removeMember} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab submissions={submissions} />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-8 w-8 text-primary/60" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EnterpriseRegistrationForm({ onCreated, userId }: { onCreated: () => void; userId: string }) {
  const [form, setForm] = useState({ name: '', rccm: '', nif: '', sector: 'Commerce', address: '', island: '', city: '', phone: '', email: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Le nom de l\'entreprise est requis'); return; }
    if (!form.sector) { toast.error('Le secteur est requis'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('enterprise_profiles').insert({
        user_id: userId,
        name: form.name.trim(),
        rccm: form.rccm.trim() || null,
        nif: form.nif.trim() || null,
        sector: form.sector,
        address: form.address.trim() || null,
        island: form.island || null,
        city: form.city.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        description: form.description.trim(),
      } as any);
      if (error) throw error;
      toast.success('Entreprise enregistrée ! Elle sera vérifiée par un administrateur.');
      onCreated();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Enregistrer votre entreprise</CardTitle>
        <CardDescription>
          Créez un profil professionnel pour gérer vos publications et soumettre des offres aux appels d'offres conformément à la loi OHADA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom de l'entreprise *</Label>
            <Input placeholder="Ex: SARL Comores Import" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Secteur d'activité *</Label>
            <Select value={form.sector} onValueChange={v => setForm(p => ({ ...p, sector: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>RCCM (Registre du Commerce)</Label>
            <Input placeholder="Ex: KM-MOR-01-2024-B12-00123" value={form.rccm} onChange={e => setForm(p => ({ ...p, rccm: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>NIF (Numéro d'Identification Fiscale)</Label>
            <Input placeholder="Ex: 4012345678" value={form.nif} onChange={e => setForm(p => ({ ...p, nif: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Île</Label>
            <Select value={form.island} onValueChange={v => setForm(p => ({ ...p, island: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input placeholder="Ex: Moroni" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input placeholder="Adresse complète" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input placeholder="+269 3XX XX XX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Email professionnel</Label>
            <Input placeholder="contact@entreprise.km" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description de l'entreprise</Label>
          <Textarea placeholder="Décrivez brièvement votre entreprise et ses activités..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">📋 Processus de vérification :</p>
          <p>• Votre entreprise sera créée immédiatement avec un statut « non vérifiée »</p>
          <p>• Un administrateur examinera votre profil et vos documents (RCCM, NIF)</p>
          <p>• Une fois vérifiée, votre entreprise recevra un badge de confiance ✅</p>
          <p>• Les entreprises vérifiées peuvent soumettre des offres aux appels d'offres</p>
        </div>

        <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2" size="lg">
          <Building2 className="h-5 w-5" />
          {saving ? 'Enregistrement...' : 'Enregistrer mon entreprise'}
        </Button>
      </CardContent>
    </Card>
  );
}

function EnterpriseProfileEditor({ enterprise, onUpdate }: { enterprise: EnterpriseProfile; onUpdate: (u: Partial<EnterpriseProfile>) => Promise<void> }) {
  const [form, setForm] = useState(enterprise);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        name: form.name,
        rccm: form.rccm,
        nif: form.nif,
        sector: form.sector,
        address: form.address,
        island: form.island,
        city: form.city,
        phone: form.phone,
        email: form.email,
        description: form.description,
      });
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Informations de l'entreprise</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Secteur *</Label>
            <Select value={form.sector} onValueChange={v => setForm(p => ({ ...p, sector: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>RCCM</Label>
            <Input value={form.rccm || ''} onChange={e => setForm(p => ({ ...p, rccm: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>NIF</Label>
            <Input value={form.nif || ''} onChange={e => setForm(p => ({ ...p, nif: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Île</Label>
            <Select value={form.island || ''} onValueChange={v => setForm(p => ({ ...p, island: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input value={form.city || ''} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Site web</Label>
            <Input value={form.website || ''} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
}

function TenderSubmissionsTab({ submissions, onSubmit, enterpriseId, isVerified }: {
  submissions: any[];
  onSubmit: (s: any) => Promise<any>;
  enterpriseId: string;
  isVerified: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tender_id: '', cover_letter: '', proposed_amount: '', currency: 'FC' });
  const [tenders, setTenders] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadTenders = async () => {
    const { data } = await supabase
      .from('content_items')
      .select('id, title, category')
      .eq('type', 'tender')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    setTenders(data || []);
  };

  const handleSubmit = async () => {
    if (!form.tender_id || !form.cover_letter.trim()) {
      toast.error('Sélectionnez un appel d\'offres et rédigez votre lettre');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        tender_id: form.tender_id,
        cover_letter: form.cover_letter.trim(),
        proposed_amount: form.proposed_amount ? parseFloat(form.proposed_amount) : null,
        currency: form.currency,
      });
      toast.success('Soumission envoyée avec succès');
      setForm({ tender_id: '', cover_letter: '', proposed_amount: '', currency: 'FC' });
      setShowForm(false);
    } catch (err: any) {
      if (err.message?.includes('unique')) {
        toast.error('Vous avez déjà soumis une offre pour cet appel d\'offres');
      } else {
        toast.error(err.message || 'Erreur lors de la soumission');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Soumissions aux appels d'offres</h3>
        {isVerified ? (
          <Button onClick={() => { setShowForm(!showForm); if (!showForm) loadTenders(); }} className="gap-1">
            <Plus className="h-4 w-4" /> Nouvelle soumission
          </Button>
        ) : (
          <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" /> Vérification requise</Badge>
        )}
      </div>

      {!isVerified && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-sm text-yellow-800">
            ⚠️ Votre entreprise doit être vérifiée par un administrateur avant de pouvoir soumettre des offres aux appels d'offres. Complétez votre profil (RCCM, NIF) pour accélérer la vérification.
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Appel d'offres *</Label>
              <Select value={form.tender_id} onValueChange={v => setForm(p => ({ ...p, tender_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un appel d'offres" /></SelectTrigger>
                <SelectContent>
                  {tenders.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lettre de motivation / Offre technique *</Label>
              <Textarea placeholder="Décrivez votre offre, vos qualifications et votre approche..." value={form.cover_letter} onChange={e => setForm(p => ({ ...p, cover_letter: e.target.value }))} rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant proposé</Label>
                <Input type="number" placeholder="0" value={form.proposed_amount} onChange={e => setForm(p => ({ ...p, proposed_amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FC">FC (Francs Comoriens)</SelectItem>
                    <SelectItem value="EUR">EUR (Euros)</SelectItem>
                    <SelectItem value="USD">USD (Dollars)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting} className="gap-1">
                <Send className="h-4 w-4" /> {submitting ? 'Envoi...' : 'Soumettre'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {submissions.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune soumission pour le moment</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => {
            const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card key={sub.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{sub.tender?.title || 'Appel d\'offres'}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{sub.cover_letter}</p>
                      {sub.proposed_amount && (
                        <p className="text-sm font-medium mt-1">{sub.proposed_amount.toLocaleString()} {sub.currency}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(sub.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Badge className={`${cfg.color} text-white gap-1`}>
                      <StatusIcon className="h-3 w-3" /> {cfg.label}
                    </Badge>
                  </div>
                  {sub.review_notes && (
                    <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                      <p className="font-medium text-xs mb-1">Note de l'évaluateur :</p>
                      <p>{sub.review_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamTab({ members, onAdd, onRemove }: { members: any[]; onAdd: (userId: string, role: string) => Promise<void>; onRemove: (id: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!email.trim()) { toast.error('Entrez un email'); return; }
    setAdding(true);
    try {
      const { data } = await supabase.from('users').select('id').eq('email', email.trim()).maybeSingle();
      if (!data) { toast.error('Utilisateur non trouvé'); setAdding(false); return; }
      await onAdd(data.id, role);
      toast.success('Collaborateur ajouté');
      setEmail('');
    } catch (err: any) {
      toast.error(err.message?.includes('unique') ? 'Ce collaborateur est déjà dans l\'équipe' : 'Erreur');
    }
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Ajouter un collaborateur</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Email du collaborateur" value={email} onChange={e => setEmail(e.target.value)} className="flex-1" />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membre</SelectItem>
                <SelectItem value="manager">Gestionnaire</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={adding} className="gap-1">
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {members.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun collaborateur</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <Card key={m.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{m.username}</p>
                  <Badge variant="secondary" className="text-xs">{m.role === 'manager' ? 'Gestionnaire' : 'Membre'}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => onRemove(m.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ submissions }: { submissions: any[] }) {
  const total = submissions.length;
  const accepted = submissions.filter(s => s.status === 'accepted').length;
  const pending = submissions.filter(s => s.status === 'pending').length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;
  const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-primary">{total}</p><p className="text-xs text-muted-foreground">Total soumissions</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-600">{accepted}</p><p className="text-xs text-muted-foreground">Acceptées</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-yellow-600">{pending}</p><p className="text-xs text-muted-foreground">En attente</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-red-600">{rejected}</p><p className="text-xs text-muted-foreground">Rejetées</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-5xl font-bold text-primary">{rate}%</p>
          <p className="text-sm text-muted-foreground mt-2">Taux d'acceptation</p>
        </CardContent>
      </Card>
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-sm text-blue-800">
          <p className="font-medium">📊 Conseils pour améliorer vos soumissions :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Complétez votre profil d'entreprise (RCCM, NIF) pour la vérification</li>
            <li>Rédigez des offres techniques détaillées et précises</li>
            <li>Proposez des montants réalistes et compétitifs</li>
            <li>Joignez tous les documents requis par l'appel d'offres</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
