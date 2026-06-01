import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { 
  UtensilsCrossed, 
  Hotel, 
  Home, 
  ChefHat,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  User
} from 'lucide-react';
import { toast } from 'sonner';

type GastronomyType = 'recipe' | 'restaurant_dish' | 'hotel_room' | 'private_room';
type ContentStatus = 'published' | 'draft' | 'archived';

interface GastronomyItem {
  id: string;
  type: GastronomyType;
  title: string;
  description: string;
  price_min?: number;
  price_max?: number;
  images?: string[];
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
  location?: string;
  category?: string;
  status: ContentStatus;
  views: number;
  author_id: string;
  created_at: string;
  users?: {
    username: string;
    email: string;
    account_type: 'free' | 'pro' | 'enterprise';
  };
}

export default function GastronomyManagementSection() {
  const { user } = useAuth();
  const [items, setItems] = useState<GastronomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<GastronomyItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gastronomy_items')
        .select(`
          *,
          users (
            username,
            email,
            account_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching gastronomy items:', error);
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    try {
      const { error } = await supabase
        .from('gastronomy_items')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        _action_type: 'gastronomy_status_change',
        _target_type: 'gastronomy_item',
        _target_id: id,
        _description: `Statut changé en: ${status}`
      });

      toast.success(`Statut mis à jour: ${status}`);
      fetchItems();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      const { error } = await supabase
        .from('gastronomy_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        _action_type: 'gastronomy_delete',
        _target_type: 'gastronomy_item',
        _target_id: id,
        _description: 'Annonce supprimée'
      });

      toast.success('Annonce supprimée');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEdit = (item: GastronomyItem) => {
    setEditingItem({ ...item });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('gastronomy_items')
        .update({
          title: editingItem.title,
          description: editingItem.description,
          category: editingItem.category ?? null,
          location: editingItem.location ?? null,
          price_min: editingItem.price_min ?? null,
          price_max: editingItem.price_max ?? null,
          contact_phone: editingItem.contact_phone ?? null,
          contact_email: editingItem.contact_email ?? null,
          contact_whatsapp: editingItem.contact_whatsapp ?? null,
        })
        .eq('id', editingItem.id);
      if (error) throw error;
      await supabase.rpc('log_admin_action', {
        _action_type: 'gastronomy_edit',
        _target_type: 'gastronomy_item',
        _target_id: editingItem.id,
        _description: `Annonce modifiée: ${editingItem.title}`,
      });
      toast.success('Annonce modifiée');
      setEditOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (e: any) {
      console.error('Edit error:', e);
      toast.error(e?.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: GastronomyType) => {
    switch (type) {

      case 'recipe':
        return <ChefHat className="h-4 w-4" />;
      case 'restaurant_dish':
        return <UtensilsCrossed className="h-4 w-4" />;
      case 'hotel_room':
        return <Hotel className="h-4 w-4" />;
      case 'private_room':
        return <Home className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: GastronomyType) => {
    switch (type) {
      case 'recipe':
        return 'Recette';
      case 'restaurant_dish':
        return 'Restaurant';
      case 'hotel_room':
        return 'Hôtel';
      case 'private_room':
        return 'Particulier';
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700">Publié</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-700">Brouillon</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-700">Archivé</Badge>;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: items.length,
    published: items.filter(i => i.status === 'published').length,
    draft: items.filter(i => i.status === 'draft').length,
    recipes: items.filter(i => i.type === 'recipe').length,
    restaurants: items.filter(i => i.type === 'restaurant_dish').length,
    hotels: items.filter(i => i.type === 'hotel_room').length,
    private: items.filter(i => i.type === 'private_room').length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion Tourisme</h2>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <UtensilsCrossed className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recettes</p>
                <p className="text-2xl font-bold">{stats.recipes}</p>
              </div>
              <ChefHat className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Restaurants</p>
                <p className="text-2xl font-bold">{stats.restaurants}</p>
              </div>
              <UtensilsCrossed className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hébergements</p>
                <p className="text-2xl font-bold">{stats.hotels + stats.private}</p>
              </div>
              <Hotel className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche et Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="recipe">Recettes</SelectItem>
                <SelectItem value="restaurant_dish">Restaurants</SelectItem>
                <SelectItem value="hotel_room">Hôtels</SelectItem>
                <SelectItem value="private_room">Particuliers</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Annonces ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Chargement...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune annonce trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm">{item.users?.username}</p>
                          {item.users?.account_type === 'pro' && (
                            <Badge variant="secondary" className="text-xs">PRO</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.price_min || item.price_max ? (
                        <span className="text-sm font-semibold">
                          {item.price_min && item.price_max && item.price_min !== item.price_max
                            ? `${item.price_min}-${item.price_max} KMF`
                            : `${item.price_min || item.price_max} KMF`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.location ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{item.location}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Eye className="h-3 w-3" />
                        {item.views}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Select 
                          value={item.status} 
                          onValueChange={(status) => handleStatusChange(item.id, status as ContentStatus)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Publier</SelectItem>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="archived">Archiver</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(item)}
                          className="h-8 w-8 p-0"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" /> Modifier l'annonce
            </DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label>Titre</Label>
                <Input
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={5}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Input
                    value={editingItem.category || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Localisation</Label>
                  <Input
                    value={editingItem.location || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prix min (KMF)</Label>
                  <Input
                    type="number"
                    value={editingItem.price_min ?? ''}
                    onChange={(e) => setEditingItem({ ...editingItem, price_min: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label>Prix max (KMF)</Label>
                  <Input
                    type="number"
                    value={editingItem.price_max ?? ''}
                    onChange={(e) => setEditingItem({ ...editingItem, price_max: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={editingItem.contact_phone || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, contact_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={editingItem.contact_whatsapp || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, contact_whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editingItem.contact_email || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, contact_email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

