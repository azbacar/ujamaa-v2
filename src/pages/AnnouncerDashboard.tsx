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
  Calendar, MapPin, Users, Clock, ImagePlus, X
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
  accommodation_type: '',
  room_types: [] as { name: string; description: string; price_min: number; price_max: number }[],
  latitude: '',
  longitude: '',
};

export default function AnnouncerDashboard() {
  const { user } = useAuth();
  const { isAnnonceur } = useRole();
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
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
    const [itemsRes, eventsRes, gastroRes, privRes] = await Promise.all([
      supabase.from('content_items').select('id, title, description, type, status, views, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('events').select('id, title, description, status, views, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('gastronomy_items').select('id, title, description, type, status, views, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('announcer_privileges').select('*').eq('user_id', user.id),
    ]);
    
    const contentItems: ContentItem[] = (itemsRes.data || []).map(i => ({ ...i, source: 'content' as const }));
    const eventItems: ContentItem[] = (eventsRes.data || []).map(e => ({ ...e, type: 'event', views: e.views || 0, status: e.status || 'draft', source: 'event' as const }));
    const gastroItems: ContentItem[] = (gastroRes.data || []).map(g => ({ ...g, type: 'tourisme', views: g.views || 0, status: g.status || 'draft', source: 'content' as const }));
    
    const all = [...contentItems, ...eventItems, ...gastroItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(all);
    setPrivileges(privRes.data || []);
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
          accommodation_type: newForm.accommodation_type || null,
          room_types: newForm.room_types.length > 0 ? newForm.room_types : [],
          latitude: newForm.latitude ? parseFloat(newForm.latitude) : null,
          longitude: newForm.longitude ? parseFloat(newForm.longitude) : null,
        } as any).select().single();
        if (error) throw error;
        toast.success('Publication tourisme soumise pour modération');
      } else {
        // content_items: announcement, service, tender
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
        toast.success(newForm.type === 'tender' ? 'Appel d\'offres soumis pour modération' : 'Annonce soumise pour modération');
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
  const isTenderOrService = newForm.type === 'tender' || newForm.type === 'service';

  const typeLabels: Record<string, string> = {
    announcement: '📢 Annonce',
    event: '🎉 Événement',
    service: '🏛️ Service',
    tender: '📋 Appel d\'offres',
    tourisme: '🏝️ Tourisme',
  };

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
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gérez vos annonces, événements et appels d'offres</p>
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
                  <Badge key={key} variant={active ? 'default' : 'outline'} className={`px-3 py-1.5 ${active ? `${cfg.color} text-white` : 'opacity-50'}`}>
                    <Icon className="h-3 w-3 mr-1" />
                    {cfg.label}{!active && ' (inactif)'}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{items.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{items.filter(i => i.source === 'event').length}</p><p className="text-xs text-muted-foreground">Événements</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{items.filter(i => i.status === 'published').length}</p><p className="text-xs text-muted-foreground">Publiés</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{items.reduce((s, i) => s + i.views, 0)}</p><p className="text-xs text-muted-foreground">Vues</p></CardContent></Card>
        </div>

        <Tabs defaultValue="my-content">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-content"><FileText className="h-4 w-4 mr-1" /> Mes publications</TabsTrigger>
            <TabsTrigger value="create"><Plus className="h-4 w-4 mr-1" /> Créer</TabsTrigger>
          </TabsList>

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
                        <Label>Localisation</Label>
                        <Input value={newForm.gastronomy_location} onChange={e => updateForm('gastronomy_location', e.target.value)} placeholder="Ex: Moroni, Grande Comore" />
                      </div>
                    </div>
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
                    {/* Image upload for tourism */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2"><ImagePlus className="h-4 w-4 text-primary" /> Photos (max 5, 5 Mo chacune)</Label>
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
