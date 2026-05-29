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
  Megaphone, Plus, FileText, Eye, Crown,
  CheckCircle, Zap, Phone, Save, Trash2, ChevronRight, MessageCircle,
  Calendar, MapPin, Users, Clock, ImagePlus, X, DollarSign,
  TrendingUp, Sparkles, Inbox, BarChart3
} from 'lucide-react';
import MyPricesTab from '@/components/MyPricesTab';
import ReceivedTenderSubmissions from '@/components/ReceivedTenderSubmissions';
import VendorLocationShareCard from '@/components/VendorLocationShareCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { authPath, proPath } from '@/lib/authRedirect';

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  views: number;
  created_at: string;
  source: 'content' | 'event';
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

const ISLANDS = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];
const EVENT_CATEGORIES = ['Culture', 'Sport', 'Musique', 'Conférence', 'Formation', 'Religieux', 'Associatif', 'Autre'];
const GASTRONOMY_TYPES = [
  { value: 'recipe', label: '🍳 Recette' },
  { value: 'restaurant_dish', label: '🍽️ Plat de restaurant' },
  { value: 'hotel_room', label: '🏨 Chambre d\'hôtel' },
  { value: 'private_room', label: '🏠 Hébergement particulier' },
];

const DINING_STYLES = [
  { value: 'fast-food', label: '🍔 Fast-food' },
  { value: 'sur-table', label: '🍽️ Sur table' },
  { value: 'mixte', label: '🍔🍽️ Mixte' },
  { value: 'buffet', label: '🍴 Buffet' },
  { value: 'traiteur', label: '👨‍🍳 Traiteur' },
];

const ACCOMMODATION_TYPES = [
  { value: 'hotel', label: '🏨 Hôtel' },
  { value: 'villa', label: '🏡 Villa' },
  { value: 'auberge', label: '🛏️ Auberge' },
  { value: 'chambre-hote', label: '🏠 Chambre d\'hôte' },
  { value: 'appartement', label: '🏢 Appartement' },
  { value: 'bungalow', label: '🏖️ Bungalow' },
];

const PROCUREMENT_TYPES = [
  { value: 'aoo', label: 'Appel d\'offres ouvert' },
  { value: 'aor', label: 'Appel d\'offres restreint' },
  { value: 'ami', label: 'Manifestation d\'intérêt' },
  { value: 'consultation', label: 'Consultation restreinte' },
  { value: 'gre_a_gre', label: 'Gré à gré' },
];

const initialForm = {
  title: '', description: '', type: 'announcement', category: '',
  contact_phone: '', contact_whatsapp: '', contact_email: '',
  // Event-specific
  date: '', end_date: '', location: '', island: '', organizer: '',
  capacity: '', price: '', currency: 'FC',
  requires_registration: false, requires_payment: false,
  // Gastronomy-specific
  gastronomy_type: 'recipe' as string,
  price_min: '', price_max: '', gastronomy_location: '',
  dining_style: '',
  service_mode: '',
  accommodation_type: '',
  room_types: [] as { name: string; description: string; price_min: number; price_max: number }[],
  latitude: '',
  longitude: '',
  // Tender (OHADA) specific
  reference_number: '', procurement_type: '', contracting_authority: '',
  budget_estimate: '', tender_currency: 'KMF', guarantee_amount: '',
  lots_count: '', deadline_at: '', opening_at: '',
  opening_location: '', submission_location: '', tender_island: '',
};

export default function AnnouncerDashboard() {
  const { user } = useAuth();
  const { isAnnonceur } = useRole();
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [accountType, setAccountType] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newForm, setNewForm] = useState(initialForm);
  const [eventImages, setEventImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [itemsRes, eventsRes, gastroRes, privRes, userRes] = await Promise.all([
      supabase.from('content_items').select('id, title, description, type, status, views, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('events').select('id, title, description, status, views, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('gastronomy_items').select('id, title, description, type, status, views, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('announcer_privileges').select('*').eq('user_id', user.id),
      supabase.from('users').select('account_type').eq('id', user.id).maybeSingle(),
    ]);
    
    const contentItems: ContentItem[] = (itemsRes.data || []).map(i => ({ ...i, source: 'content' as const }));
    const eventItems: ContentItem[] = (eventsRes.data || []).map(e => ({ ...e, type: 'event', views: e.views || 0, status: e.status || 'draft', source: 'event' as const }));
    const gastroItems: ContentItem[] = (gastroRes.data || []).map(g => ({ ...g, type: 'tourisme', views: g.views || 0, status: g.status || 'draft', source: 'content' as const }));
    
    const all = [...contentItems, ...eventItems, ...gastroItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(all);
    setPrivileges(privRes.data || []);
    setAccountType((userRes.data as any)?.account_type || 'free');
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !newForm.title || !newForm.description) {
      toast.error('Remplissez le titre et la description');
      return;
    }

    setSubmitting(true);
    try {
      if (newForm.type === 'event') {
        // Validate event-specific fields
        if (!newForm.date || !newForm.location || !newForm.island || !newForm.organizer || !newForm.category) {
          toast.error('Remplissez tous les champs obligatoires de l\'événement');
          setSubmitting(false);
          return;
        }
        // Upload images first
        const uploadedUrls: string[] = [];
        for (const file of eventImages) {
          const ext = file.name.split('.').pop();
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('event-images').upload(path, file, { upsert: false });
          if (uploadError) throw new Error(`Erreur upload image: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }

        const { error } = await supabase.from('events').insert({
          title: newForm.title,
          description: newForm.description,
          date: new Date(newForm.date).toISOString(),
          end_date: newForm.end_date ? new Date(newForm.end_date).toISOString() : null,
          location: newForm.location,
          island: newForm.island,
          organizer: newForm.organizer,
          category: newForm.category,
          capacity: newForm.capacity ? parseInt(newForm.capacity) : null,
          price: newForm.price ? parseFloat(newForm.price) : 0,
          currency: newForm.currency,
          requires_registration: newForm.requires_registration,
          requires_payment: newForm.requires_payment,
          contact_phone: newForm.contact_phone || null,
          contact_email: newForm.contact_email || null,
          author_id: user.id,
          status: 'draft',
          images: uploadedUrls.length > 0 ? uploadedUrls : null,
        });
        if (error) throw error;
        toast.success('Événement soumis pour modération');
      } else if (newForm.type === 'tourisme') {
        // gastronomy_items
        const uploadedUrls: string[] = [];
        for (const file of eventImages) {
          const ext = file.name.split('.').pop();
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('event-images').upload(path, file, { upsert: false });
          if (uploadError) throw new Error(`Erreur upload image: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path);
          uploadedUrls.push(urlData.publicUrl);
        }
        const { data: insertedItem, error } = await supabase.from('gastronomy_items').insert({
          title: newForm.title,
          description: newForm.description,
          type: newForm.gastronomy_type as any,
          category: newForm.category || null,
          location: newForm.gastronomy_location || null,
          price_min: newForm.price_min ? parseFloat(newForm.price_min) : null,
          price_max: newForm.price_max ? parseFloat(newForm.price_max) : null,
          contact_phone: newForm.contact_phone || null,
          contact_email: newForm.contact_email || null,
          contact_whatsapp: newForm.contact_whatsapp || null,
          author_id: user.id,
          status: 'draft',
          images: uploadedUrls.length > 0 ? uploadedUrls : null,
          dining_style: newForm.dining_style || null,
          service_mode: newForm.service_mode || null,
          accommodation_type: newForm.accommodation_type || null,
          room_types: newForm.room_types.length > 0 ? newForm.room_types : [],
          latitude: newForm.latitude ? parseFloat(newForm.latitude) : null,
          longitude: newForm.longitude ? parseFloat(newForm.longitude) : null,
        } as any).select().single();
        if (error) throw error;
        toast.success('Publication tourisme soumise pour modération');
      } else {
        // content_items: announcement, service, tender
        const isTender = newForm.type === 'tender';
        const payload: any = {
          title: newForm.title,
          description: newForm.description,
          type: newForm.type as any,
          category: newForm.category || null,
          author_id: user.id,
          status: 'draft',
          contact_phone: newForm.contact_phone || null,
          contact_whatsapp: newForm.contact_whatsapp || null,
        };
        if (isTender) {
          payload.reference_number = newForm.reference_number || null;
          payload.procurement_type = newForm.procurement_type || null;
          payload.contracting_authority = newForm.contracting_authority || null;
          payload.budget_estimate = newForm.budget_estimate ? parseFloat(newForm.budget_estimate) : null;
          payload.currency = newForm.tender_currency || 'KMF';
          payload.guarantee_amount = newForm.guarantee_amount ? parseFloat(newForm.guarantee_amount) : null;
          payload.lots_count = newForm.lots_count ? parseInt(newForm.lots_count) : null;
          payload.deadline_at = newForm.deadline_at ? new Date(newForm.deadline_at).toISOString() : null;
          payload.opening_at = newForm.opening_at ? new Date(newForm.opening_at).toISOString() : null;
          payload.opening_location = newForm.opening_location || null;
          payload.submission_location = newForm.submission_location || null;
          payload.island = newForm.tender_island || null;
        }
        const { error } = await supabase.from('content_items').insert(payload);
        if (error) throw error;
        toast.success(isTender ? 'Appel d\'offres soumis pour modération' : 'Annonce soumise pour modération');
      }
      setNewForm(initialForm);
      setEventImages([]);
      setImagePreviews([]);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ContentItem) => {
    if (!confirm('Supprimer ce brouillon ?')) return;
    try {
      if (item.source === 'event') {
        await supabase.from('events').delete().eq('id', item.id).eq('status', 'draft');
      } else {
        await supabase.from('content_items').delete().eq('id', item.id).eq('status', 'draft');
      }
      toast.success('Supprimé');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const updateForm = (field: string, value: any) => setNewForm(prev => ({ ...prev, [field]: value }));

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} dépasse 5 Mo`); return false; }
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} n'est pas une image`); return false; }
      return true;
    });
    if (eventImages.length + validFiles.length > 5) {
      toast.error('Maximum 5 images');
      return;
    }
    setEventImages(prev => [...prev, ...validFiles]);
    validFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setEventImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  const activePrivileges = privileges.filter(p => p.is_active);
  const isEvent = newForm.type === 'event';
  const isTourisme = newForm.type === 'tourisme';
  const isTender = newForm.type === 'tender';
  const isTenderOrService = isTender || newForm.type === 'service';

  const typeLabels: Record<string, string> = {
    announcement: '📢 Annonce',
    event: '🎉 Événement',
    service: '🏛️ Service',
    tender: '📋 Appel d\'offres',
    tourisme: '🏝️ Tourisme',
  };

  const accountLabel = accountType === 'enterprise' ? 'Entreprise' : accountType === 'pro' ? 'Pro' : 'Gratuit';
  const totalViews = items.reduce((s, i) => s + i.views, 0);
  const publishedCount = items.filter(i => i.status === 'published').length;
  const draftCount = items.filter(i => i.status === 'draft').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background">
      <Header currentLanguage="fr" onLanguageChange={() => {}} />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl space-y-6">
        {/* Hero header */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-sm">
          <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden>
            <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white blur-3xl" />
            <div className="absolute -left-8 -bottom-16 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-white/85 uppercase tracking-wider">
                <Megaphone className="h-3.5 w-3.5" /> Espace Annonceur
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1 truncate">Tableau de bord</h1>
              <p className="text-white/85 mt-1 text-sm sm:text-base">
                Pilotez vos annonces, événements, prix et appels d'offres.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white text-emerald-700 border border-white/40 font-medium">
                  <Crown className="h-3 w-3" /> Compte {accountLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/30">
                  <FileText className="h-3 w-3" /> {items.length} publication{items.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            {accountType !== 'pro' && accountType !== 'enterprise' && (
              <Button
                size="sm"
                onClick={() => navigate(proPath())}
                className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm self-start sm:self-auto"
              >
                <Crown className="h-4 w-4 mr-2" /> Passer Pro
              </Button>
            )}
          </div>
        </section>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Publications', value: items.length, icon: FileText, tone: 'text-emerald-600 bg-emerald-50' },
            { label: 'Publiées', value: publishedCount, icon: CheckCircle, tone: 'text-blue-600 bg-blue-50' },
            { label: 'En attente', value: draftCount, icon: Clock, tone: 'text-amber-600 bg-amber-50' },
            { label: 'Vues totales', value: totalViews, icon: TrendingUp, tone: 'text-violet-600 bg-violet-50' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} className="border-border/60 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold leading-none">{value}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Privileges */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Mes privilèges
              </CardTitle>
              {activePrivileges.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {activePrivileges.length} actif{activePrivileges.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(PRIVILEGE_CONFIG).map(([key, cfg]) => {
                const priv = privileges.find(p => p.privilege === key);
                const active = priv?.is_active;
                const Icon = cfg.icon;
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                      active
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : 'border-dashed border-border bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    <span className={`h-7 w-7 rounded-md flex items-center justify-center text-white ${active ? cfg.color : 'bg-muted-foreground/40'}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">{cfg.label}</p>
                      <p className="text-[10px] leading-tight">{active ? 'Actif' : 'Inactif'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {activePrivileges.length === 0 && (
              <Button variant="link" size="sm" className="px-0 mt-2 text-xs" onClick={() => navigate(proPath())}>
                Découvrir les offres <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="my-content">
          <TabsList className="w-full h-auto p-1 bg-muted/60 grid grid-cols-3 sm:grid-cols-5 gap-1">
            <TabsTrigger value="my-content" className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 py-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" /> Publications
            </TabsTrigger>
            <TabsTrigger value="received" className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 py-2 text-xs sm:text-sm">
              <Inbox className="h-4 w-4" /> Soumissions
            </TabsTrigger>
            <TabsTrigger value="my-prices" className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 py-2 text-xs sm:text-sm">
              <DollarSign className="h-4 w-4" /> Mes prix
            </TabsTrigger>
            <TabsTrigger value="gps" className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 py-2 text-xs sm:text-sm">
              <MapPin className="h-4 w-4" /> GPS
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5 py-2 text-xs sm:text-sm">
              <Plus className="h-4 w-4" /> Créer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <ReceivedTenderSubmissions />
          </TabsContent>

          <TabsContent value="gps">
            <VendorLocationShareCard isProAnnonceur={accountType === 'pro' || accountType === 'enterprise'} />
          </TabsContent>

          {/* My content list */}
          <TabsContent value="my-content" className="space-y-3">
            {items.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Aucune publication</CardContent></Card>
            ) : (
              items.map(item => (
                <Card key={item.id}>
                  <CardContent className="pt-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{typeLabels[item.type] || item.type}</Badge>
                        <Badge variant={item.status === 'published' ? 'default' : item.status === 'draft' ? 'secondary' : 'outline'}>
                          {item.status === 'published' ? 'Publié' : item.status === 'draft' ? 'En attente' : item.status === 'cancelled' ? 'Annulé' : 'Archivé'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {item.views}</span>
                        <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    {item.status === 'draft' && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* My prices tab — same as profile, for usability */}
          <TabsContent value="my-prices">
            <MyPricesTab />
          </TabsContent>

          {/* Create form */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Créer une publication</CardTitle>
                <CardDescription>Votre publication sera soumise à modération avant diffusion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Type de publication *</Label>
                    <Select value={newForm.type} onValueChange={v => updateForm('type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">📢 Annonce</SelectItem>
                        <SelectItem value="event">🎉 Événement</SelectItem>
                        <SelectItem value="tourisme">🏝️ Tourisme</SelectItem>
                        <SelectItem value="service">🏛️ Service</SelectItem>
                        <SelectItem value="tender">📋 Appel d'offres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Catégorie {isEvent ? '*' : ''}</Label>
                    {isEvent ? (
                      <Select value={newForm.category} onValueChange={v => updateForm('category', v)}>
                        <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
                        <SelectContent>
                          {EVENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={newForm.category} onChange={e => updateForm('category', e.target.value)} placeholder="Ex: Commerce, Santé..." />
                    )}
                  </div>
                </div>

                {/* Common fields */}
                <div>
                  <Label>Titre *</Label>
                  <Input value={newForm.title} onChange={e => updateForm('title', e.target.value)} placeholder="Titre de la publication" />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea value={newForm.description} onChange={e => updateForm('description', e.target.value)} rows={4} placeholder="Description détaillée..." />
                </div>

                {/* Tourisme-specific fields */}
                {isTourisme && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <h4 className="font-medium text-sm flex items-center gap-2">🏝️ Détails tourisme</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Type de tourisme *</Label>
                        <Select value={newForm.gastronomy_type} onValueChange={v => updateForm('gastronomy_type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {GASTRONOMY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Localisation (adresse)</Label>
                        <Input value={newForm.gastronomy_location} onChange={e => updateForm('gastronomy_location', e.target.value)} placeholder="Ex: Moroni, Grande Comore" />
                      </div>
                    </div>

                    {/* Restaurant: dining style */}
                    {newForm.gastronomy_type === 'restaurant_dish' && (
                      <div>
                        <Label>Style de restauration</Label>
                        <Select value={newForm.dining_style} onValueChange={v => updateForm('dining_style', v)}>
                          <SelectTrigger><SelectValue placeholder="Choisir le style" /></SelectTrigger>
                          <SelectContent>
                            {DINING_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Restaurant: service mode (sur place / emporter) */}
                    {newForm.gastronomy_type === 'restaurant_dish' && (
                      <div>
                        <Label>Mode de service</Label>
                        <Select value={newForm.service_mode} onValueChange={v => updateForm('service_mode', v)}>
                          <SelectTrigger><SelectValue placeholder="Sur place / À emporter" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sur-place">🍽️ Sur place uniquement</SelectItem>
                            <SelectItem value="emporter">📦 À emporter uniquement</SelectItem>
                            <SelectItem value="les-deux">🍽️📦 Sur place & À emporter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Hotel/Accommodation: type */}
                    {(newForm.gastronomy_type === 'hotel_room' || newForm.gastronomy_type === 'private_room') && (
                      <div>
                        <Label>Type d'hébergement</Label>
                        <Select value={newForm.accommodation_type} onValueChange={v => updateForm('accommodation_type', v)}>
                          <SelectTrigger><SelectValue placeholder="Choisir le type" /></SelectTrigger>
                          <SelectContent>
                            {ACCOMMODATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Room types for hotels/accommodations */}
                    {(newForm.gastronomy_type === 'hotel_room' || newForm.gastronomy_type === 'private_room') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Types de chambres / tarifs</Label>
                          <Button variant="outline" size="sm" onClick={() => updateForm('room_types', [...newForm.room_types, { name: '', description: '', price_min: 0, price_max: 0 }])}>
                            <Plus className="h-3 w-3 mr-1" /> Ajouter
                          </Button>
                        </div>
                        {newForm.room_types.map((rt, idx) => (
                          <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end p-3 border rounded-lg">
                            <div className="col-span-2">
                              <Input placeholder="Nom (ex: Suite, Standard)" value={rt.name} onChange={e => {
                                const updated = [...newForm.room_types];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                updateForm('room_types', updated);
                              }} className="h-8 text-sm" />
                            </div>
                            <Input type="number" placeholder="Prix min" value={rt.price_min || ''} onChange={e => {
                              const updated = [...newForm.room_types];
                              updated[idx] = { ...updated[idx], price_min: parseFloat(e.target.value) || 0 };
                              updateForm('room_types', updated);
                            }} className="h-8 text-sm" />
                            <Input type="number" placeholder="Prix max" value={rt.price_max || ''} onChange={e => {
                              const updated = [...newForm.room_types];
                              updated[idx] = { ...updated[idx], price_max: parseFloat(e.target.value) || 0 };
                              updateForm('room_types', updated);
                            }} className="h-8 text-sm" />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                              updateForm('room_types', newForm.room_types.filter((_, i) => i !== idx));
                            }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Prix minimum (KMF)</Label>
                        <Input type="number" value={newForm.price_min} onChange={e => updateForm('price_min', e.target.value)} placeholder="0" />
                      </div>
                      <div>
                        <Label>Prix maximum (KMF)</Label>
                        <Input type="number" value={newForm.price_max} onChange={e => updateForm('price_max', e.target.value)} placeholder="0" />
                      </div>
                    </div>

                    {/* Geolocation */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Géolocalisation</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input type="number" step="any" placeholder="Latitude" value={newForm.latitude} onChange={e => updateForm('latitude', e.target.value)} className="text-sm" />
                        <Input type="number" step="any" placeholder="Longitude" value={newForm.longitude} onChange={e => updateForm('longitude', e.target.value)} className="text-sm" />
                      </div>
                      <Button variant="outline" size="sm" type="button" onClick={() => {
                        if (!navigator.geolocation) { toast.error('Géolocalisation non supportée'); return; }
                        navigator.geolocation.getCurrentPosition(
                          pos => { updateForm('latitude', pos.coords.latitude.toString()); updateForm('longitude', pos.coords.longitude.toString()); toast.success('Position obtenue'); },
                          () => toast.error('Impossible d\'obtenir la position')
                        );
                      }}>
                        <MapPin className="h-3 w-3 mr-1" /> Ma position actuelle
                      </Button>
                    </div>

                    {/* Image upload for tourism */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><ImagePlus className="h-4 w-4 text-primary" /> Photos (max 10, 5 Mo chacune)</Label>
                      <div className="flex flex-wrap gap-3">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-border group">
                            <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {eventImages.length < 10 && (
                          <label className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                            <ImagePlus className="h-6 w-6 text-primary/60" />
                            <span className="text-[10px] text-muted-foreground mt-1">Ajouter</span>
                            <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Notice about menu management */}
                    {newForm.gastronomy_type === 'restaurant_dish' && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                        <p className="font-medium text-primary">💡 Menu avec photos</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Après la création, vous pourrez ajouter les éléments de votre menu avec photos et prix depuis la fiche du restaurant.
                        </p>
                      </div>
                    )}
                    {newForm.gastronomy_type === 'recipe' && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                        <p className="font-medium text-primary">🧑‍🍳 Ingrédients & Dosages</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Après la création, vous pourrez ajouter les ingrédients avec leurs dosages précis (grammes, pincées, etc.).
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Event-specific fields */}
                {isEvent && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <h4 className="font-medium text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Détails de l'événement</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Date de début *</Label>
                        <Input type="datetime-local" value={newForm.date} onChange={e => updateForm('date', e.target.value)} />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Date de fin</Label>
                        <Input type="datetime-local" value={newForm.end_date} onChange={e => updateForm('end_date', e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Lieu *</Label>
                        <Input value={newForm.location} onChange={e => updateForm('location', e.target.value)} placeholder="Ex: Salle des fêtes, Moroni" />
                      </div>
                      <div>
                        <Label>Île *</Label>
                        <Select value={newForm.island} onValueChange={v => updateForm('island', v)}>
                          <SelectTrigger><SelectValue placeholder="Choisir l'île" /></SelectTrigger>
                          <SelectContent>
                            {ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Organisateur *</Label>
                      <Input value={newForm.organizer} onChange={e => updateForm('organizer', e.target.value)} placeholder="Nom de l'organisateur" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> Capacité</Label>
                        <Input type="number" value={newForm.capacity} onChange={e => updateForm('capacity', e.target.value)} placeholder="Illimitée" />
                      </div>
                      <div>
                        <Label>Prix d'entrée</Label>
                        <Input type="number" value={newForm.price} onChange={e => updateForm('price', e.target.value)} placeholder="0 = Gratuit" />
                      </div>
                      <div>
                        <Label>Devise</Label>
                        <Select value={newForm.currency} onValueChange={v => updateForm('currency', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FC">FC (Franc Comorien)</SelectItem>
                            <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={newForm.requires_registration} onChange={e => updateForm('requires_registration', e.target.checked)} className="rounded" />
                        Inscription requise
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={newForm.requires_payment} onChange={e => updateForm('requires_payment', e.target.checked)} className="rounded" />
                        Paiement requis
                      </label>
                    </div>

                    {/* Image upload */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><ImagePlus className="h-4 w-4 text-primary" /> Affiches / Images (max 5, 5 Mo chacune)</Label>
                      <div className="flex flex-wrap gap-3">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-border group">
                            <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {eventImages.length < 5 && (
                          <label className="w-24 h-24 rounded-lg border-2 border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                            <ImagePlus className="h-6 w-6 text-primary/60" />
                            <span className="text-[10px] text-muted-foreground mt-1">Ajouter</span>
                            <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tender (OHADA) specific fields */}
                {isTender && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <h4 className="font-medium text-sm flex items-center gap-2">📋 Détails OHADA de l'appel d'offres</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>N° de référence</Label>
                        <Input value={newForm.reference_number} onChange={e => updateForm('reference_number', e.target.value)} placeholder="Ex: AO-2026-001" />
                      </div>
                      <div>
                        <Label>Type de procédure</Label>
                        <Select value={newForm.procurement_type} onValueChange={v => updateForm('procurement_type', v)}>
                          <SelectTrigger><SelectValue placeholder="Choisir une procédure" /></SelectTrigger>
                          <SelectContent>
                            {PROCUREMENT_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Autorité contractante</Label>
                      <Input value={newForm.contracting_authority} onChange={e => updateForm('contracting_authority', e.target.value)} placeholder="Ex: Ministère des Finances" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label>Budget estimé</Label>
                        <Input type="number" value={newForm.budget_estimate} onChange={e => updateForm('budget_estimate', e.target.value)} placeholder="0" />
                      </div>
                      <div>
                        <Label>Devise</Label>
                        <Select value={newForm.tender_currency} onValueChange={v => updateForm('tender_currency', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KMF">KMF</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Garantie de soumission</Label>
                        <Input type="number" value={newForm.guarantee_amount} onChange={e => updateForm('guarantee_amount', e.target.value)} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label>Nombre de lots</Label>
                        <Input type="number" value={newForm.lots_count} onChange={e => updateForm('lots_count', e.target.value)} placeholder="1" />
                      </div>
                      <div>
                        <Label>Île</Label>
                        <Select value={newForm.tender_island} onValueChange={v => updateForm('tender_island', v)}>
                          <SelectTrigger><SelectValue placeholder="Île" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grande-comore">Grande Comore</SelectItem>
                            <SelectItem value="anjouan">Anjouan</SelectItem>
                            <SelectItem value="moheli">Mohéli</SelectItem>
                            <SelectItem value="mayotte">Mayotte</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Date limite de dépôt</Label>
                        <Input type="datetime-local" value={newForm.deadline_at} onChange={e => updateForm('deadline_at', e.target.value)} />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Ouverture des plis</Label>
                        <Input type="datetime-local" value={newForm.opening_at} onChange={e => updateForm('opening_at', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Lieu de dépôt</Label>
                        <Input value={newForm.submission_location} onChange={e => updateForm('submission_location', e.target.value)} placeholder="Ex: Bureau du DG, Moroni" />
                      </div>
                      <div>
                        <Label>Lieu d'ouverture des plis</Label>
                        <Input value={newForm.opening_location} onChange={e => updateForm('opening_location', e.target.value)} placeholder="Ex: Salle de conférence" />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-muted-foreground">
                      💡 Conformité OHADA — Tous les soumissionnaires devront fournir RCCM/NIF, attestations fiscales et caution. Vous recevrez les offres par email + WhatsApp et dans votre espace "Soumissions reçues".
                    </div>
                  </div>
                )}

                {/* Contact fields for service/tender/event/tourisme */}
                {(isTenderOrService || isEvent || isTourisme) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Téléphone</Label>
                      <Input value={newForm.contact_phone} onChange={e => updateForm('contact_phone', e.target.value)} placeholder="+269 XXX XX XX" />
                    </div>
                    {isEvent ? (
                      <div>
                        <Label className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Email de contact</Label>
                        <Input type="email" value={newForm.contact_email} onChange={e => updateForm('contact_email', e.target.value)} placeholder="contact@exemple.com" />
                      </div>
                    ) : (
                      <div>
                        <Label className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</Label>
                        <Input value={newForm.contact_whatsapp} onChange={e => updateForm('contact_whatsapp', e.target.value)} placeholder="269XXXXXXX" />
                        <p className="text-xs text-muted-foreground mt-1">Sans + ni espaces</p>
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={handleCreate} disabled={submitting} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" /> {submitting ? 'Envoi en cours...' : 'Soumettre pour modération'}
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
