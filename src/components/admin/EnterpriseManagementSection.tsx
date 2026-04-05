import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Building2, CheckCircle, XCircle, Search, Shield, Globe, Phone, Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

interface Enterprise {
  id: string;
  user_id: string;
  name: string;
  rccm: string | null;
  nif: string | null;
  sector: string;
  island: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  status: string;
  created_at: string;
  description: string | null;
  username?: string;
}

interface TenderSub {
  id: string;
  tender_id: string;
  enterprise_id: string;
  cover_letter: string;
  proposed_amount: number | null;
  currency: string;
  status: string;
  review_notes: string | null;
  created_at: string;
  enterprise_name?: string;
  tender_title?: string;
}

export default function EnterpriseManagementSection() {
  const { user } = useAuth();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [submissions, setSubmissions] = useState<TenderSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [entRes, subRes] = await Promise.all([
      supabase.from('enterprise_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('tender_submissions').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    const ents = (entRes.data || []) as Enterprise[];
    // Fetch usernames
    if (ents.length > 0) {
      const { data: users } = await supabase.rpc('get_public_usernames', { _user_ids: ents.map(e => e.user_id) });
      const uMap = new Map((users || []).map(u => [u.id, u.username]));
      ents.forEach(e => { e.username = uMap.get(e.user_id) || 'Inconnu'; });
    }
    setEnterprises(ents);

    const subs = (subRes.data || []) as TenderSub[];
    if (subs.length > 0) {
      const entIds = [...new Set(subs.map(s => s.enterprise_id))];
      const tenderIds = [...new Set(subs.map(s => s.tender_id))];
      const [entNames, tenderNames] = await Promise.all([
        supabase.from('enterprise_profiles').select('id, name').in('id', entIds),
        supabase.from('content_items').select('id, title').in('id', tenderIds),
      ]);
      const eMap = new Map((entNames.data || []).map(e => [e.id, e.name]));
      const tMap = new Map((tenderNames.data || []).map(t => [t.id, t.title]));
      subs.forEach(s => {
        s.enterprise_name = eMap.get(s.enterprise_id) || 'Inconnu';
        s.tender_title = tMap.get(s.tender_id) || 'Inconnu';
      });
    }
    setSubmissions(subs);
    setLoading(false);
  };

  const handleVerify = async (id: string, verify: boolean) => {
    const updates: any = { is_verified: verify };
    if (verify) { updates.verified_at = new Date().toISOString(); updates.verified_by = user?.id; }
    const { error } = await supabase.from('enterprise_profiles').update(updates).eq('id', id);
    if (error) { toast.error('Erreur'); return; }
    toast.success(verify ? 'Entreprise vérifiée ✅' : 'Vérification retirée');

    // Notify the enterprise owner
    const ent = enterprises.find(e => e.id === id);
    if (ent) {
      await supabase.from('notifications').insert({
        user_id: ent.user_id,
        title: verify ? '✅ Entreprise vérifiée' : '❌ Vérification retirée',
        message: verify
          ? `Votre entreprise "${ent.name}" a été vérifiée. Vous pouvez maintenant soumettre des offres aux appels d'offres.`
          : `La vérification de "${ent.name}" a été retirée.`,
        type: verify ? 'success' : 'warning',
        link: '/entreprise',
      });
    }

    setEnterprises(prev => prev.map(e => e.id === id ? { ...e, is_verified: verify } : e));
  };

  const handleSubmissionReview = async (id: string, status: 'accepted' | 'rejected', notes?: string) => {
    const { error } = await supabase.from('tender_submissions').update({
      status,
      review_notes: notes || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    } as any).eq('id', id);
    if (error) { toast.error('Erreur'); return; }
    toast.success(status === 'accepted' ? 'Soumission acceptée' : 'Soumission rejetée');
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const filtered = enterprises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.username || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gestion des entreprises</h2>
          <p className="text-sm text-muted-foreground">{enterprises.length} entreprises enregistrées</p>
        </div>
      </div>

      <Tabs defaultValue="enterprises">
        <TabsList>
          <TabsTrigger value="enterprises" className="gap-1"><Building2 className="h-4 w-4" /> Entreprises ({enterprises.length})</TabsTrigger>
          <TabsTrigger value="submissions" className="gap-1"><Shield className="h-4 w-4" /> Soumissions ({submissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="enterprises" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          {filtered.map(ent => (
            <Card key={ent.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{ent.name}</span>
                      <Badge variant={ent.is_verified ? 'default' : 'secondary'}>
                        {ent.is_verified ? '✅ Vérifiée' : '⏳ Non vérifiée'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      👤 {ent.username} • 🏢 {ent.sector} • 📍 {ent.island || 'N/A'}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                      {ent.rccm && <span>RCCM: {ent.rccm}</span>}
                      {ent.nif && <span>NIF: {ent.nif}</span>}
                      {ent.phone && <span>📞 {ent.phone}</span>}
                      {ent.email && <span>✉️ {ent.email}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!ent.is_verified ? (
                      <Button size="sm" onClick={() => handleVerify(ent.id, true)} className="gap-1 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4" /> Vérifier
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleVerify(ent.id, false)} className="gap-1 text-red-600">
                        <XCircle className="h-4 w-4" /> Retirer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4 mt-4">
          {submissions.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune soumission</CardContent></Card>
          ) : submissions.map(sub => (
            <Card key={sub.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">📋 {sub.tender_title}</p>
                    <p className="text-sm text-muted-foreground">🏢 {sub.enterprise_name}</p>
                    <p className="text-sm mt-1 line-clamp-2">{sub.cover_letter}</p>
                    {sub.proposed_amount && <p className="text-sm font-medium mt-1">{sub.proposed_amount.toLocaleString()} {sub.currency}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(sub.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant={sub.status === 'accepted' ? 'default' : sub.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {sub.status === 'accepted' ? '✅ Acceptée' : sub.status === 'rejected' ? '❌ Rejetée' : '⏳ En attente'}
                    </Badge>
                    {sub.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSubmissionReview(sub.id, 'accepted')} className="bg-green-600 hover:bg-green-700">Accepter</Button>
                        <Button size="sm" variant="outline" onClick={() => handleSubmissionReview(sub.id, 'rejected')} className="text-red-600">Rejeter</Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
