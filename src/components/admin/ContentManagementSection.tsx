import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, Calendar, Briefcase, Megaphone, Eye, Edit, Trash2, Plus, Save, Users, MapPin, X
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: 'published' | 'draft' | 'archived';
  type: 'announcement' | 'event' | 'service' | 'tender';
  author_id: string;
  published_at: string;
  views: number;
  created_at: string;
  updated_at: string;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
}

export default function ContentManagementSection() {
  const { user } = useAuth();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('announcements');
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [eventsCount, setEventsCount] = useState(0);
  const [newItemForm, setNewItemForm] = useState({
    title: '', description: '', category: '',
    type: 'announcement' as 'announcement' | 'service' | 'tender',
    contact_phone: '', contact_whatsapp: ''
  });

  useEffect(() => { fetchContentItems(); }, []);

  const fetchContentItems = async () => {
    try {
      setLoading(true);
      const [contentResult, eventsResult] = await Promise.all([
        supabase.from('content_items').select('*').order('published_at', { ascending: false }),
        supabase.from('events').select('*', { count: 'exact', head: true })
      ]);
      if (contentResult.error) throw contentResult.error;
      setContentItems(contentResult.data || []);
      setEventsCount(eventsResult.count || 0);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  const getContentByType = (type: string) => {
    const typeMap: Record<string, string> = {
      'announcements': 'announcement', 'services': 'service', 'tenders': 'tender'
    };
    return contentItems.filter(item => item.type === typeMap[type]);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('content_items')
        .update({ status: status as any }).eq('id', id);
      if (error) throw error;
      toast.success(`Statut mis à jour: ${status}`);
      fetchContentItems();
    } catch { toast.error('Erreur lors de la mise à jour du statut'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    try {
      const { error } = await supabase.from('content_items').delete().eq('id', id);
      if (error) throw error;
      toast.success('Élément supprimé');
      fetchContentItems();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const handleCreateNew = async () => {
    if (!newItemForm.title || !newItemForm.description) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (!user) { toast.error('Vous devez être connecté'); return; }
    try {
      const { error } = await supabase.from('content_items').insert({
        type: newItemForm.type,
        title: newItemForm.title,
        description: newItemForm.description,
        category: newItemForm.category || null,
        contact_phone: newItemForm.contact_phone || null,
        contact_whatsapp: newItemForm.contact_whatsapp || null,
        author_id: user.id,
        status: 'published'
      });
      if (error) throw error;
      toast.success('Nouvel élément créé');
      setNewItemForm({ title: '', description: '', category: '', type: 'announcement', contact_phone: '', contact_whatsapp: '' });
      fetchContentItems();
    } catch { toast.error('Erreur lors de la création'); }
  };

  const handleEditSave = async () => {
    if (!editingItem) return;
    try {
      const { error } = await supabase.from('content_items').update({
        title: editingItem.title,
        description: editingItem.description,
        category: editingItem.category,
        contact_phone: editingItem.contact_phone,
        contact_whatsapp: editingItem.contact_whatsapp,
      }).eq('id', editingItem.id);
      if (error) throw error;
      toast.success('Contenu mis à jour');
      setIsEditDialogOpen(false);
      setEditingItem(null);
      fetchContentItems();
    } catch { toast.error('Erreur lors de la mise à jour'); }
  };

  const openEditDialog = (item: ContentItem) => {
    setEditingItem({ ...item });
    setIsEditDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'announcements': return <Megaphone className="h-5 w-5" />;
      case 'services': return <Briefcase className="h-5 w-5" />;
      case 'tenders': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'published': return 'bg-green-50 text-green-600 border-green-200';
      case 'draft': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'archived': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestion du Contenu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
              <Megaphone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{contentItems.filter(item => item.type === 'announcement').length}</div>
              <div className="text-sm text-slate-600">Annonces</div>
            </div>
            <div className="text-center p-4 border border-green-200 rounded-lg bg-green-50">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{eventsCount}</div>
              <div className="text-sm text-slate-600">Événements</div>
            </div>
            <div className="text-center p-4 border border-purple-200 rounded-lg bg-purple-50">
              <Briefcase className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{contentItems.filter(item => item.type === 'service').length}</div>
              <div className="text-sm text-slate-600">Services</div>
            </div>
            <div className="text-center p-4 border border-orange-200 rounded-lg bg-orange-50">
              <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{contentItems.filter(item => item.type === 'tender').length}</div>
              <div className="text-sm text-slate-600">Appels d'offres</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-blue-200">
          <TabsTrigger value="announcements" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Megaphone className="h-4 w-4" /> Annonces
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Briefcase className="h-4 w-4" /> Services
          </TabsTrigger>
          <TabsTrigger value="tenders" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4" /> Appels d'offres
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Plus className="h-4 w-4" /> Créer
          </TabsTrigger>
        </TabsList>

        {['announcements', 'services', 'tenders'].map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {getTypeIcon(type)}
                {type === 'announcements' && 'Gestion des Annonces'}
                {type === 'services' && 'Gestion des Services'}
                {type === 'tenders' && 'Gestion des Appels d\'offres'}
              </h3>
              <Button onClick={() => setSelectedTab('create')} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Ajouter
              </Button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : getContentByType(type).length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun contenu de ce type</p>
                </div>
              ) : (
                getContentByType(type).map((item) => (
                  <Card key={item.id} className="border-blue-200 bg-white hover:bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg">{item.title}</h4>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                          </div>
                          <p className="text-slate-600 text-sm">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />Auteur #{item.author_id.slice(0, 8)}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(item.published_at).toLocaleDateString('fr-FR')}</span>
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.views} vues</span>
                            {item.category && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.category}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={item.status} onValueChange={(status) => handleStatusChange(item.id, status)}>
                            <SelectTrigger className="w-32 border-blue-200"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="published">Publié</SelectItem>
                              <SelectItem value="draft">Brouillon</SelectItem>
                              <SelectItem value="archived">Archivé</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" className="border-blue-200" onClick={() => openEditDialog(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}

        <TabsContent value="create" className="space-y-4">
          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-green-600 flex items-center gap-2">
                <Plus className="h-5 w-5" /> Créer un nouveau contenu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Type de contenu</Label>
                  <Select value={newItemForm.type} onValueChange={(v) => setNewItemForm({...newItemForm, type: v as any})}>
                    <SelectTrigger className="border-blue-200 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">📢 Annonce</SelectItem>
                      <SelectItem value="service">🏛️ Service</SelectItem>
                      <SelectItem value="tender">📋 Appel d'offres</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Les événements se gèrent dans la section "Événements"</p>
                </div>
                <div>
                  <Label>Catégorie</Label>
                  <Input value={newItemForm.category} onChange={(e) => setNewItemForm({...newItemForm, category: e.target.value})} placeholder="Ex: Transport, Culture..." className="border-blue-200 bg-white" />
                </div>
              </div>
              <div>
                <Label>Titre</Label>
                <Input value={newItemForm.title} onChange={(e) => setNewItemForm({...newItemForm, title: e.target.value})} placeholder="Titre du contenu..." className="border-blue-200 bg-white" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newItemForm.description} onChange={(e) => setNewItemForm({...newItemForm, description: e.target.value})} placeholder="Description détaillée..." rows={6} className="border-blue-200 bg-white" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Téléphone de contact</Label>
                  <Input value={newItemForm.contact_phone} onChange={(e) => setNewItemForm({...newItemForm, contact_phone: e.target.value})} placeholder="+269..." className="border-blue-200 bg-white" />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={newItemForm.contact_whatsapp} onChange={(e) => setNewItemForm({...newItemForm, contact_whatsapp: e.target.value})} placeholder="+269..." className="border-blue-200 bg-white" />
                </div>
              </div>
              <Button onClick={handleCreateNew} className="bg-green-600 hover:bg-green-700 text-white">
                <Save className="h-4 w-4 mr-2" /> Créer et publier
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le contenu</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label>Titre</Label>
                <Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editingItem.description || ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} rows={5} />
              </div>
              <div>
                <Label>Catégorie</Label>
                <Input value={editingItem.category || ''} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Téléphone</Label>
                  <Input value={editingItem.contact_phone || ''} onChange={(e) => setEditingItem({ ...editingItem, contact_phone: e.target.value })} />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={editingItem.contact_whatsapp || ''} onChange={(e) => setEditingItem({ ...editingItem, contact_whatsapp: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleEditSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="h-4 w-4 mr-2" /> Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
