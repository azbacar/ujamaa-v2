import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Handshake, Plus, Save, Trash2, Settings, ShieldCheck, Eye, CheckCircle2, XCircle, Clock, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ISLANDS = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];

interface Partner {
  id: string;
  user_id: string;
  business_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  island: string | null;
  city: string | null;
  status: string;
  created_at: string;
  kyc_status: 'pending' | 'submitted' | 'approved' | 'rejected';
  kyc_rejection_reason: string | null;
  kyc_reviewed_at: string | null;
}

interface KycDoc {
  id: string;
  partner_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  notes: string | null;
  created_at: string;
}

interface Settings {
  id: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  currency: string;
  pro_plan_price: number;
  is_active: boolean;
}

export default function PartnersManagementSection() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // Create form
  const [createForm, setCreateForm] = useState({
    email: '', business_name: '', contact_name: '', contact_phone: '', island: '', city: '',
  });
  const [creating, setCreating] = useState(false);

  // Settings form
  const [savingSettings, setSavingSettings] = useState(false);

  // KYC review state
  const [kycPartner, setKycPartner] = useState<Partner | null>(null);
  const [kycDocs, setKycDocs] = useState<KycDoc[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const openKycReview = async (p: Partner) => {
    setKycPartner(p);
    setRejectionReason(p.kyc_rejection_reason || '');
    const { data } = await supabase
      .from('partner_kyc_documents')
      .select('*')
      .eq('partner_id', p.id)
      .order('created_at', { ascending: false });
    setKycDocs((data as any) || []);
  };

  const handleViewDoc = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .createSignedUrl(path, 600);
    if (error || !data?.signedUrl) { toast.error('Impossible d\'ouvrir le document'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const reviewKyc = async (decision: 'approved' | 'rejected') => {
    if (!kycPartner) return;
    if (decision === 'rejected' && !rejectionReason.trim()) {
      toast.error('Indiquez un motif de rejet'); return;
    }
    setReviewing(true);
    try {
      const { error } = await supabase
        .from('partner_accounts')
        .update({
          kyc_status: decision,
          kyc_rejection_reason: decision === 'rejected' ? rejectionReason.trim() : null,
        })
        .eq('id', kycPartner.id);
      if (error) throw error;
      toast.success(decision === 'approved' ? 'KYC approuvé ✅' : 'KYC rejeté');
      setKycPartner(null);
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally {
      setReviewing(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      supabase.from('partner_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_settings').select('*').eq('is_active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setPartners((pRes.data as any) || []);
    setSettings(sRes.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreatePartner = async () => {
    if (!user) return;
    if (!createForm.email || !createForm.business_name) {
      toast.error('Email et nom commercial requis'); return;
    }
    setCreating(true);
    try {
      const { data: u } = await supabase.from('users').select('id').eq('email', createForm.email.toLowerCase().trim()).maybeSingle();
      if (!u?.id) {
        toast.error('Utilisateur introuvable. Demandez-lui de créer un compte UJAMAA d\'abord.');
        return;
      }
      const { error } = await supabase.from('partner_accounts').insert({
        user_id: u.id,
        business_name: createForm.business_name,
        contact_name: createForm.contact_name || null,
        contact_phone: createForm.contact_phone || null,
        contact_email: createForm.email,
        island: createForm.island || null,
        city: createForm.city || null,
        created_by: user.id,
        status: 'active',
      });
      if (error) throw error;
      // Add partner role
      await supabase.from('user_roles').insert({ user_id: u.id, role: 'partner' as any });
      toast.success('Concessionnaire créé ✅');
      setCreateForm({ email: '', business_name: '', contact_name: '', contact_phone: '', island: '', city: '' });
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (p: Partner) => {
    const newStatus = p.status === 'active' ? 'suspended' : 'active';
    await supabase.from('partner_accounts').update({ status: newStatus }).eq('id', p.id);
    toast.success(`Statut → ${newStatus}`);
    fetchAll();
  };

  const handleDelete = async (p: Partner) => {
    if (!confirm(`Supprimer le partenaire "${p.business_name}" ?`)) return;
    await supabase.from('partner_accounts').delete().eq('id', p.id);
    await supabase.from('user_roles').delete().eq('user_id', p.user_id).eq('role', 'partner' as any);
    toast.success('Partenaire supprimé');
    fetchAll();
  };

  const saveSettings = async () => {
    if (!settings || !user) return;
    setSavingSettings(true);
    try {
      const { error } = await supabase.from('partner_settings').update({
        commission_type: settings.commission_type,
        commission_value: settings.commission_value,
        currency: settings.currency,
        pro_plan_price: settings.pro_plan_price,
        updated_by: user.id,
      }).eq('id', settings.id);
      if (error) throw error;
      toast.success('Configuration sauvegardée ✅');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally {
      setSavingSettings(false);
    }
  };

  const pendingKyc = partners.filter(p => p.kyc_status === 'submitted');

  return (
    <div className="space-y-6">
      {/* KYC à examiner */}
      {pendingKyc.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <ShieldCheck className="h-5 w-5" /> Dossiers KYC à examiner
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 ml-1">{pendingKyc.length}</Badge>
            </CardTitle>
            <CardDescription>Validez l'identité avant que ces concessionnaires puissent reverser des dépôts à AZZHY.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingKyc.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 border bg-background rounded-lg">
                <div>
                  <p className="font-medium">{p.business_name}</p>
                  <p className="text-xs text-muted-foreground">{p.contact_email} · {p.city || '—'} {p.island || ''}</p>
                </div>
                <Button size="sm" onClick={() => openKycReview(p)}>
                  <Eye className="h-4 w-4 mr-1" /> Examiner
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Settings className="h-5 w-5" /> Configuration des commissions
          </CardTitle>
          <CardDescription>S'applique à tous les concessionnaires</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={settings.commission_type} onValueChange={(v) => setSettings({ ...settings, commission_type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixed">Montant fixe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valeur ({settings.commission_type === 'percentage' ? '%' : settings.currency})</Label>
                  <Input type="number" value={settings.commission_value} onChange={(e) => setSettings({ ...settings, commission_value: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Prix Pro mensuel ({settings.currency})</Label>
                  <Input type="number" value={settings.pro_plan_price} onChange={(e) => setSettings({ ...settings, pro_plan_price: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <Button onClick={saveSettings} disabled={savingSettings}>
                <Save className="h-4 w-4 mr-2" /> Sauvegarder
              </Button>
            </>
          ) : <p className="text-sm text-muted-foreground">Configuration absente</p>}
        </CardContent>
      </Card>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Plus className="h-5 w-5" /> Créer un concessionnaire
          </CardTitle>
          <CardDescription>L'utilisateur doit déjà avoir un compte UJAMAA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Email du compte UJAMAA *</Label>
              <Input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Nom commercial *</Label>
              <Input value={createForm.business_name} onChange={e => setCreateForm({ ...createForm, business_name: e.target.value })} />
            </div>
            <div>
              <Label>Personne de contact</Label>
              <Input value={createForm.contact_name} onChange={e => setCreateForm({ ...createForm, contact_name: e.target.value })} />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={createForm.contact_phone} onChange={e => setCreateForm({ ...createForm, contact_phone: e.target.value })} />
            </div>
            <div>
              <Label>Île</Label>
              <Select value={createForm.island} onValueChange={(v) => setCreateForm({ ...createForm, island: v })}>
                <SelectTrigger><SelectValue placeholder="Île" /></SelectTrigger>
                <SelectContent>{ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ville</Label>
              <Input value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleCreatePartner} disabled={creating}>
            <Handshake className="h-4 w-4 mr-2" /> Créer le concessionnaire
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-primary">
            <span className="flex items-center gap-2"><Handshake className="h-5 w-5" /> Concessionnaires</span>
            <Badge variant="outline">{partners.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Chargement...</p> :
           partners.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Aucun concessionnaire</p> :
           partners.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <p className="font-semibold">{p.business_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.contact_email} {p.contact_phone && `• ${p.contact_phone}`}
                  </p>
                  <p className="text-xs text-muted-foreground">📍 {p.city || '—'} {p.island || ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {p.kyc_status === 'approved' ? (
                    <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" /> KYC OK</Badge>
                  ) : p.kyc_status === 'submitted' ? (
                    <Badge className="bg-ocean-100 text-ocean-700"><Clock className="h-3 w-3 mr-1" /> KYC à examiner</Badge>
                  ) : p.kyc_status === 'rejected' ? (
                    <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> KYC rejeté</Badge>
                  ) : (
                    <Badge variant="outline">KYC en attente</Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openKycReview(p)}>
                    <ShieldCheck className="h-4 w-4 mr-1" /> KYC
                  </Button>
                  <Badge className={p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                    {p.status === 'active' ? 'Actif' : 'Suspendu'}
                  </Badge>
                  <Switch checked={p.status === 'active'} onCheckedChange={() => toggleStatus(p)} />
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* KYC Review Dialog */}
      <Dialog open={!!kycPartner} onOpenChange={(o) => !o && setKycPartner(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> KYC — {kycPartner?.business_name}
            </DialogTitle>
            <DialogDescription>
              Statut actuel : <strong>{kycPartner?.kyc_status}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium">Documents fournis ({kycDocs.length})</p>
            {kycDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun document soumis.</p>
            ) : kycDocs.map(d => (
              <div key={d.id} className="flex items-center justify-between p-2.5 border rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.document_type}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.file_name}</p>
                    {d.notes && <p className="text-xs italic text-muted-foreground truncate">{d.notes}</p>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleViewDoc(d.file_path)}>
                  <ExternalLink className="h-4 w-4 mr-1" /> Voir
                </Button>
              </div>
            ))}

            <div>
              <Label>Motif (en cas de rejet)</Label>
              <Textarea
                placeholder="Ex: pièce d'identité illisible, justificatif manquant..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="destructive" onClick={() => reviewKyc('rejected')} disabled={reviewing}>
                <XCircle className="h-4 w-4 mr-1" /> Rejeter
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => reviewKyc('approved')} disabled={reviewing}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approuver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
