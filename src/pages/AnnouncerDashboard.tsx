import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Megaphone, Plus, FileText, Eye, BarChart3, Crown, 
  CheckCircle, Zap, Phone, Save, Trash2, ChevronRight, MessageCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  views: number;
  created_at: string;
}

interface Privilege {
  id: string;
  privilege: string;
  is_active: boolean;
  expires_at: string | null;
}

const PRIVILEGE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  pro: { label: 'PRO', icon: Crown, color: 'bg-amber-500' },
  verified: { label: 'Vérifié', icon: CheckCircle, color: 'bg-blue-500' },
  boost_ia: { label: 'Boost IA', icon: Zap, color: 'bg-purple-500' },
  contact_direct: { label: 'Contact Direct', icon: Phone, color: 'bg-green-500' },
};

export default function AnnouncerDashboard() {
  const { user } = useAuth();
  const { isAnnonceur } = useRole();
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [loading, setLoading] = useState(true);
  const [newForm, setNewForm] = useState({ title: '', description: '', type: 'announcement', category: '', contact_phone: '', contact_whatsapp: '' });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [itemsRes, privRes] = await Promise.all([
      supabase.from('content_items').select('*').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('announcer_privileges').select('*').eq('user_id', user.id),
    ]);
    setItems(itemsRes.data || []);
    setPrivileges(privRes.data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newForm.title || !newForm.description) {
      toast.error('Remplissez tous les champs');
      return;
    }
    try {
      const { error } = await supabase.from('content_items').insert({
        title: newForm.title,
        description: newForm.description,
        type: newForm.type as any,
        category: newForm.category || null,
        author_id: user.id,
        status: 'draft',
        contact_phone: newForm.contact_phone || null,
        contact_whatsapp: newForm.contact_whatsapp || null,
      });
      if (error) throw error;
      toast.success('Annonce soumise pour modération');
      setNewForm({ title: '', description: '', type: 'announcement', category: '', contact_phone: '', contact_whatsapp: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce brouillon ?')) return;
    try {
      await supabase.from('content_items').delete().eq('id', id).eq('status', 'draft');
      toast.success('Supprimé');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const activePrivileges = privileges.filter(p => p.is_active);

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage="fr" onLanguageChange={() => {}} />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <Megaphone className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Espace Annonceur
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gérez vos annonces et privilèges</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/pro')}>
            <Crown className="h-4 w-4 mr-2" /> Upgrade PRO
          </Button>
        </div>

        {/* Privilege badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mes privilèges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(PRIVILEGE_CONFIG).map(([key, cfg]) => {
                const priv = privileges.find(p => p.privilege === key);
                const active = priv?.is_active;
                const Icon = cfg.icon;
                return (
                  <Badge
                    key={key}
                    variant={active ? 'default' : 'outline'}
                    className={`px-3 py-1.5 ${active ? `${cfg.color} text-white` : 'opacity-50'}`}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {cfg.label}
                    {!active && ' (inactif)'}
                  </Badge>
                );
              })}
            </div>
            {activePrivileges.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Aucun privilège actif.{' '}
                <Button variant="link" size="sm" className="p-0" onClick={() => navigate('/pro')}>
                  Découvrir les offres <ChevronRight className="h-3 w-3" />
                </Button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{items.length}</p>
              <p className="text-xs text-muted-foreground">Annonces</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{items.filter(i => i.status === 'published').length}</p>
              <p className="text-xs text-muted-foreground">Publiées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{items.reduce((s, i) => s + i.views, 0)}</p>
              <p className="text-xs text-muted-foreground">Vues totales</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="my-content">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-content"><FileText className="h-4 w-4 mr-1" /> Mes annonces</TabsTrigger>
            <TabsTrigger value="create"><Plus className="h-4 w-4 mr-1" /> Nouvelle annonce</TabsTrigger>
          </TabsList>

          <TabsContent value="my-content" className="space-y-3">
            {items.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Aucune annonce</CardContent></Card>
            ) : (
              items.map(item => (
                <Card key={item.id}>
                  <CardContent className="pt-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={item.status === 'published' ? 'default' : item.status === 'draft' ? 'secondary' : 'outline'}>
                          {item.status === 'published' ? 'Publié' : item.status === 'draft' ? 'En attente' : 'Archivé'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {item.views}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    {item.status === 'draft' && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Créer une nouvelle annonce</CardTitle>
                <CardDescription>Votre annonce sera soumise à modération avant publication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={newForm.type} onValueChange={v => setNewForm({ ...newForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">📢 Annonce</SelectItem>
                        <SelectItem value="event">🎉 Événement</SelectItem>
                        <SelectItem value="service">🏛️ Service</SelectItem>
                        <SelectItem value="tender">📋 Appel d'offres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Catégorie</Label>
                    <Input value={newForm.category} onChange={e => setNewForm({ ...newForm, category: e.target.value })} placeholder="Ex: Commerce, Santé..." />
                  </div>
                </div>
                <div>
                  <Label>Titre</Label>
                  <Input value={newForm.title} onChange={e => setNewForm({ ...newForm, title: e.target.value })} placeholder="Titre de l'annonce" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} rows={5} placeholder="Description détaillée..." />
                </div>
                {(newForm.type === 'service' || newForm.type === 'tender') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Numéro de contact</Label>
                      <Input value={newForm.contact_phone} onChange={e => setNewForm({ ...newForm, contact_phone: e.target.value })} placeholder="+269 XXX XX XX" />
                      <p className="text-xs text-muted-foreground mt-1">Visible uniquement avec un compte Pro</p>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</Label>
                      <Input value={newForm.contact_whatsapp} onChange={e => setNewForm({ ...newForm, contact_whatsapp: e.target.value })} placeholder="269XXXXXXX" />
                      <p className="text-xs text-muted-foreground mt-1">Numéro WhatsApp sans + ni espaces</p>
                    </div>
                  </div>
                )}
                <Button onClick={handleCreate}>
                  <Save className="h-4 w-4 mr-2" /> Soumettre pour modération
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
