import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye, 
  BarChart3, 
  Users, 
  MessageSquare, 
  Settings,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  Bell
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

interface AdminItem {
  id: number;
  title: string;
  category: string;
  content: string;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  type: 'price' | 'event' | 'tender' | 'service' | 'announcement';
}

const AdminDashboard = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [activeTab, setActiveTab] = useState('overview');
  const [editingItem, setEditingItem] = useState<AdminItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Données factices pour la démonstration
  const [items, setItems] = useState<AdminItem[]>([
    {
      id: 1,
      title: "Prix du riz en baisse au marché de Volo-Volo",
      category: "Prix & Marchés",
      content: "Le prix du riz importé a diminué de 15% cette semaine suite à l'arrivée d'un nouveau stock. Prix actuel : 1500 FC/kg.",
      status: "published",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T14:45:00Z",
      type: "price"
    },
    {
      id: 2,
      title: "Festival culturel de Mohéli - Inscriptions ouvertes",
      category: "Événements",
      content: "Le festival annuel de Mohéli aura lieu du 15 au 17 décembre. Inscriptions ouvertes pour les artistes et artisans locaux.",
      status: "published",
      createdAt: "2024-01-14T09:00:00Z",
      updatedAt: "2024-01-14T09:00:00Z",
      type: "event"
    },
    {
      id: 3,
      title: "Construction d'un Centre de Santé",
      category: "Appels d'Offres",
      content: "Construction et équipement d'un centre de santé communautaire avec 20 lits et équipements médicaux modernes",
      status: "draft",
      createdAt: "2024-01-13T15:20:00Z",
      updatedAt: "2024-01-13T15:20:00Z",
      type: "tender"
    }
  ]);

  const stats = {
    totalItems: items.length,
    published: items.filter(item => item.status === 'published').length,
    drafts: items.filter(item => item.status === 'draft').length,
    totalViews: 15432,
    todayViews: 234
  };

  const handleCreateItem = (formData: Partial<AdminItem>) => {
    const newItem: AdminItem = {
      id: Date.now(),
      title: formData.title || '',
      category: formData.category || '',
      content: formData.content || '',
      status: formData.status as 'published' | 'draft' | 'archived' || 'draft',
      type: formData.type as 'price' | 'event' | 'tender' | 'service' | 'announcement' || 'announcement',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setItems(prev => [newItem, ...prev]);
    setShowCreateForm(false);
    toast({
      title: "Élément créé",
      description: "Le nouvel élément a été créé avec succès.",
    });
  };

  const handleUpdateItem = (updatedItem: AdminItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id 
        ? { ...updatedItem, updatedAt: new Date().toISOString() }
        : item
    ));
    setEditingItem(null);
    toast({
      title: "Élément mis à jour",
      description: "L'élément a été mis à jour avec succès.",
    });
  };

  const handleDeleteItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Élément supprimé",
      description: "L'élément a été supprimé avec succès.",
      variant: "destructive"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price': return <DollarSign className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'tender': return <FileText className="w-4 h-4" />;
      case 'service': return <Building2 className="w-4 h-4" />;
      case 'announcement': return <Bell className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const ItemForm = ({ item, onSave, onCancel }: { 
    item?: AdminItem; 
    onSave: (item: Partial<AdminItem>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      title: item?.title || '',
      category: item?.category || '',
      content: item?.content || '',
      status: item?.status || 'draft',
      type: item?.type || 'announcement'
    });

    return (
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>{item ? 'Modifier l\'élément' : 'Créer un nouvel élément'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de l'élément"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Catégorie</label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prix & Marchés">Prix & Marchés</SelectItem>
                  <SelectItem value="Événements">Événements</SelectItem>
                  <SelectItem value="Appels d'Offres">Appels d'Offres</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Transports">Transports</SelectItem>
                  <SelectItem value="Santé">Santé</SelectItem>
                  <SelectItem value="Éducation">Éducation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'price' | 'event' | 'tender' | 'service' | 'announcement' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Type d'élément" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="event">Événement</SelectItem>
                  <SelectItem value="tender">Appel d'offres</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="announcement">Annonce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Statut</label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'published' | 'draft' | 'archived' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Contenu</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Contenu détaillé de l'élément"
              rows={6}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onSave(formData)} className="bg-gradient-to-r from-emerald-500 to-ocean-500">
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">🔧 Administration UJAMAA</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Gérez tous les contenus, prix, événements et services de la plateforme
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contenu
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total éléments</p>
                      <p className="text-3xl font-bold text-emerald-600">{stats.totalItems}</p>
                    </div>
                    <FileText className="w-8 h-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Publiés</p>
                      <p className="text-3xl font-bold text-green-600">{stats.published}</p>
                    </div>
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Brouillons</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.drafts}</p>
                    </div>
                    <Edit className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Vues totales</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions rapides */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="h-16 bg-gradient-to-r from-emerald-500 to-ocean-500"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Créer un nouvel élément
                  </Button>
                  <Button variant="outline" className="h-16">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Voir les statistiques
                  </Button>
                  <Button variant="outline" className="h-16">
                    <Settings className="w-5 h-5 mr-2" />
                    Paramètres du site
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {showCreateForm && (
              <ItemForm
                onSave={handleCreateItem}
                onCancel={() => setShowCreateForm(false)}
              />
            )}

            {editingItem && (
              <ItemForm
                item={editingItem}
                onSave={(formData) => handleUpdateItem({ ...editingItem, ...formData })}
                onCancel={() => setEditingItem(null)}
              />
            )}

            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestion du contenu</CardTitle>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-emerald-500 to-ocean-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getTypeIcon(item.type)}
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                            <Badge variant="outline">{item.category}</Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.content}</p>
                          <p className="text-xs text-gray-400">
                            Créé le {new Date(item.createdAt).toLocaleDateString('fr-FR')} • 
                            Modifié le {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Fonctionnalité de gestion des utilisateurs à implémenter.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Statistiques et Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Tableau de bord analytique à implémenter.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Paramètres du site</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Interface de configuration du site à implémenter.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;