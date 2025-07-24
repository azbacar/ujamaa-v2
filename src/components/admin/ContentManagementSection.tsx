import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calendar,
  Briefcase,
  Megaphone,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Save,
  Users,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'published' | 'draft' | 'archived';
  author: string;
  publishedAt: string;
  views?: number;
}

export default function ContentManagementSection() {
  const [announcements, setAnnouncements] = useState<ContentItem[]>([]);
  const [events, setEvents] = useState<ContentItem[]>([]);
  const [services, setServices] = useState<ContentItem[]>([]);
  const [tenders, setTenders] = useState<ContentItem[]>([]);
  
  const [selectedTab, setSelectedTab] = useState('announcements');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItemForm, setNewItemForm] = useState({
    title: '',
    description: '',
    category: '',
    type: 'announcement'
  });

  // Mock data - en production, ceci viendrait de la base de données
  useEffect(() => {
    setAnnouncements([
      {
        id: '1',
        title: 'Nouvelle réglementation sur les visas',
        description: 'Mise à jour des procédures pour l\'obtention des visas touristiques...',
        category: 'Immigration',
        status: 'published',
        author: 'Admin Comores',
        publishedAt: '2024-01-15T10:00:00Z',
        views: 1250
      },
      {
        id: '2',
        title: 'Fermeture temporaire du port de Moroni',
        description: 'Travaux de maintenance prévus du 20 au 25 janvier...',
        category: 'Transport',
        status: 'published',
        author: 'Port Authority',
        publishedAt: '2024-01-10T14:30:00Z',
        views: 890
      }
    ]);

    setEvents([
      {
        id: '1',
        title: 'Festival de la Culture Comorienne',
        description: 'Célébration annuelle de la culture locale avec spectacles et expositions...',
        category: 'Culture',
        status: 'published',
        author: 'Ministère Culture',
        publishedAt: '2024-01-12T09:00:00Z',
        views: 2100
      }
    ]);

    setServices([
      {
        id: '1',
        title: 'Service de délivrance de passeports',
        description: 'Obtenez votre passeport en ligne ou en personne...',
        category: 'Administrative',
        status: 'published',
        author: 'Préfecture',
        publishedAt: '2024-01-08T11:00:00Z',
        views: 3200
      }
    ]);

    setTenders([
      {
        id: '1',
        title: 'Appel d\'offres - Construction route nationale',
        description: 'Travaux de réfection de la route nationale N1...',
        category: 'Infrastructure',
        status: 'published',
        author: 'Ministère TP',
        publishedAt: '2024-01-05T16:00:00Z',
        views: 450
      }
    ]);
  }, []);

  const getContentByType = (type: string) => {
    switch(type) {
      case 'announcements': return announcements;
      case 'events': return events;
      case 'services': return services;
      case 'tenders': return tenders;
      default: return [];
    }
  };

  const handleStatusChange = (id: string, status: string, type: string) => {
    toast.success(`Statut mis à jour: ${status}`);
    // Ici on mettrait à jour la base de données
  };

  const handleDelete = (id: string, type: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      toast.success('Élément supprimé');
      // Ici on supprimerait de la base de données
    }
  };

  const handleCreateNew = () => {
    if (!newItemForm.title || !newItemForm.description) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    toast.success('Nouvel élément créé');
    setNewItemForm({ title: '', description: '', category: '', type: 'announcement' });
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'announcements': return <Megaphone className="h-5 w-5" />;
      case 'events': return <Calendar className="h-5 w-5" />;
      case 'services': return <Briefcase className="h-5 w-5" />;
      case 'tenders': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'published': return 'bg-admin-success/10 text-admin-success border-admin-success/20';
      case 'draft': return 'bg-admin-warning/10 text-admin-warning border-admin-warning/20';
      case 'archived': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <Card className="border-admin-border bg-admin-surface">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-admin-primary flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestion du Contenu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-admin-border rounded-lg bg-admin-surface-hover">
              <Megaphone className="h-8 w-8 text-admin-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{announcements.length}</div>
              <div className="text-sm text-muted-foreground">Annonces</div>
            </div>
            <div className="text-center p-4 border border-admin-border rounded-lg bg-admin-surface-hover">
              <Calendar className="h-8 w-8 text-admin-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold">{events.length}</div>
              <div className="text-sm text-muted-foreground">Événements</div>
            </div>
            <div className="text-center p-4 border border-admin-border rounded-lg bg-admin-surface-hover">
              <Briefcase className="h-8 w-8 text-admin-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">{services.length}</div>
              <div className="text-sm text-muted-foreground">Services</div>
            </div>
            <div className="text-center p-4 border border-admin-border rounded-lg bg-admin-surface-hover">
              <FileText className="h-8 w-8 text-admin-warning mx-auto mb-2" />
              <div className="text-2xl font-bold">{tenders.length}</div>
              <div className="text-sm text-muted-foreground">Appels d'offres</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Management Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-admin-surface border border-admin-border">
          <TabsTrigger value="announcements" className="flex items-center gap-2 data-[state=active]:bg-admin-primary data-[state=active]:text-white">
            <Megaphone className="h-4 w-4" />
            Annonces
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2 data-[state=active]:bg-admin-primary data-[state=active]:text-white">
            <Calendar className="h-4 w-4" />
            Événements
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2 data-[state=active]:bg-admin-primary data-[state=active]:text-white">
            <Briefcase className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="tenders" className="flex items-center gap-2 data-[state=active]:bg-admin-primary data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            Appels d'offres
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2 data-[state=active]:bg-admin-secondary data-[state=active]:text-white">
            <Plus className="h-4 w-4" />
            Créer
          </TabsTrigger>
        </TabsList>

        {/* Content Lists */}
        {['announcements', 'events', 'services', 'tenders'].map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {getTypeIcon(type)}
                {type === 'announcements' && 'Gestion des Annonces'}
                {type === 'events' && 'Gestion des Événements'}
                {type === 'services' && 'Gestion des Services'}
                {type === 'tenders' && 'Gestion des Appels d\'offres'}
              </h3>
              <Button 
                onClick={() => setSelectedTab('create')}
                className="bg-admin-secondary hover:bg-admin-secondary/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-4">
              {getContentByType(type).map((item) => (
                <Card key={item.id} className="border-admin-border bg-admin-surface hover:bg-admin-surface-hover">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{item.title}</h4>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.publishedAt).toLocaleDateString('fr-FR')}
                          </span>
                          {item.views && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {item.views} vues
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select 
                          value={item.status} 
                          onValueChange={(status) => handleStatusChange(item.id, status, type)}
                        >
                          <SelectTrigger className="w-32 border-admin-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Publié</SelectItem>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="archived">Archivé</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button size="sm" variant="outline" className="border-admin-border">
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-admin-danger text-admin-danger hover:bg-admin-danger hover:text-white"
                          onClick={() => handleDelete(item.id, type)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}

        {/* Create New Content */}
        <TabsContent value="create" className="space-y-4">
          <Card className="border-admin-border bg-admin-surface">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-admin-secondary flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Créer un nouveau contenu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Type de contenu</Label>
                  <Select value={newItemForm.type} onValueChange={(value) => setNewItemForm({...newItemForm, type: value})}>
                    <SelectTrigger className="border-admin-border bg-admin-surface">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">📢 Annonce</SelectItem>
                      <SelectItem value="event">📅 Événement</SelectItem>
                      <SelectItem value="service">🏛️ Service</SelectItem>
                      <SelectItem value="tender">📋 Appel d'offres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Catégorie</Label>
                  <Input
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({...newItemForm, category: e.target.value})}
                    placeholder="Ex: Transport, Culture, Administrative..."
                    className="border-admin-border bg-admin-surface"
                  />
                </div>
              </div>

              <div>
                <Label>Titre</Label>
                <Input
                  value={newItemForm.title}
                  onChange={(e) => setNewItemForm({...newItemForm, title: e.target.value})}
                  placeholder="Titre du contenu..."
                  className="border-admin-border bg-admin-surface"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newItemForm.description}
                  onChange={(e) => setNewItemForm({...newItemForm, description: e.target.value})}
                  placeholder="Description détaillée..."
                  rows={6}
                  className="border-admin-border bg-admin-surface"
                />
              </div>

              <Button 
                onClick={handleCreateNew}
                className="bg-admin-secondary hover:bg-admin-secondary/90 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Créer et publier
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}