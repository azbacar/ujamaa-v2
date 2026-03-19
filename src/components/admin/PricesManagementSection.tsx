import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, Filter, TrendingUp, TrendingDown, Check, X, Eye, Edit, Trash2,
  Plus, MapPin, User, DollarSign
} from 'lucide-react';

interface Price {
  id: string;
  product: string;
  category: string;
  price: number;
  unit: string;
  vendor: string;
  city: string;
  market: string;
  island: string;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  trend: 'up' | 'down' | 'stable';
}

const PricesManagementSection = () => {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingPrice, setEditingPrice] = useState<Price | null>(null);
  const [editForm, setEditForm] = useState({
    product: '', category: '', price: 0, unit: '', vendor: '',
    city: '', market: '', island: '', trend: 'stable' as string,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPrices(); }, []);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('prices').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPrices((data || []).map(p => ({
        ...p, trend: (p.trend || 'stable') as 'up' | 'down' | 'stable'
      })));
    } catch (error) {
      toast.error('Erreur lors du chargement des prix');
    } finally { setLoading(false); }
  };

  const filteredPrices = prices.filter(price => {
    const matchesSearch = price.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         price.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || price.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprovePrice = async (id: string) => {
    try {
      const { error } = await supabase.from('prices').update({ status: 'published' }).eq('id', id);
      if (error) throw error;
      toast.success('Prix approuvé'); fetchPrices();
    } catch { toast.error("Erreur lors de l'approbation"); }
  };

  const handleRejectPrice = async (id: string) => {
    try {
      const { error } = await supabase.from('prices').update({ status: 'draft' }).eq('id', id);
      if (error) throw error;
      toast.success('Prix rejeté'); fetchPrices();
    } catch { toast.error('Erreur lors du rejet'); }
  };

  const handleDeletePrice = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prix ?')) return;
    try {
      const { error } = await supabase.from('prices').delete().eq('id', id);
      if (error) throw error;
      toast.success('Prix supprimé'); fetchPrices();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const openEditDialog = (price: Price) => {
    setEditingPrice(price);
    setEditForm({
      product: price.product, category: price.category, price: price.price,
      unit: price.unit, vendor: price.vendor, city: price.city,
      market: price.market, island: price.island || '', trend: price.trend,
    });
  };

  const handleEditSave = async () => {
    if (!editingPrice) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('prices').update({
        product: editForm.product, category: editForm.category,
        price: editForm.price, unit: editForm.unit, vendor: editForm.vendor,
        city: editForm.city, market: editForm.market, island: editForm.island,
        trend: editForm.trend,
      }).eq('id', editingPrice.id);
      if (error) throw error;
      toast.success('Prix modifié avec succès');
      setEditingPrice(null);
      fetchPrices();
    } catch { toast.error('Erreur lors de la modification'); }
    finally { setSaving(false); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">✓ Publié</Badge>;
      case 'draft': return <Badge className="bg-orange-100 text-orange-700 border-orange-300">⏳ Brouillon</Badge>;
      case 'archived': return <Badge className="bg-gray-100 text-gray-700 border-gray-300">📦 Archivé</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4 rounded-full bg-blue-500"></div>;
    }
  };

  const draftCount = prices.filter(p => p.status === 'draft').length;
  const publishedCount = prices.filter(p => p.status === 'published').length;
  const totalCount = prices.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Gestion des Prix</h2>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => window.open('/prix', '_blank')}>
          <Plus className="w-4 h-4 mr-2" /> Voir la page des prix
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><DollarSign className="w-8 h-8 text-blue-600" /><div><p className="text-2xl font-bold">{totalCount}</p><p className="text-sm text-muted-foreground">Total prix</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><Check className="w-8 h-8 text-green-600" /><div><p className="text-2xl font-bold">{publishedCount}</p><p className="text-sm text-muted-foreground">Publiés</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><Eye className="w-8 h-8 text-orange-600" /><div><p className="text-2xl font-bold">{draftCount}</p><p className="text-sm text-muted-foreground">Brouillons</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><TrendingUp className="w-8 h-8 text-emerald-600" /><div><p className="text-2xl font-bold">{prices.filter(p => p.trend === 'up').length}</p><p className="text-sm text-muted-foreground">En hausse</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" />Filtres</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Rechercher un produit, vendeur ou lieu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button variant={selectedStatus === 'all' ? 'default' : 'outline'} onClick={() => setSelectedStatus('all')} size="sm">Tous</Button>
              <Button variant={selectedStatus === 'draft' ? 'default' : 'outline'} onClick={() => setSelectedStatus('draft')} size="sm">Brouillons ({draftCount})</Button>
              <Button variant={selectedStatus === 'published' ? 'default' : 'outline'} onClick={() => setSelectedStatus('published')} size="sm">Publiés</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Prix soumis ({filteredPrices.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Vendeur</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Tendance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrices.map((price) => (
                <TableRow key={price.id}>
                  <TableCell><div><p className="font-medium">{price.product}</p><p className="text-sm text-muted-foreground">{price.category}</p></div></TableCell>
                  <TableCell><span className="font-bold text-emerald-600">{price.price.toLocaleString()} FC</span> <span className="text-sm text-muted-foreground">/ {price.unit}</span></TableCell>
                  <TableCell><div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{price.vendor}</span></div></TableCell>
                  <TableCell><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm">{price.city}</p><p className="text-xs text-muted-foreground">{price.market}</p></div></div></TableCell>
                  <TableCell>{getTrendIcon(price.trend)}</TableCell>
                  <TableCell>{getStatusBadge(price.status)}</TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{new Date(price.created_at).toLocaleDateString('fr-FR')}</span></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {price.status === 'draft' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleApprovePrice(price.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50"><Check className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleRejectPrice(price.id)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"><X className="w-4 h-4" /></Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(price)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeletePrice(price.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPrices.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="font-semibold text-muted-foreground mb-1">Aucun prix trouvé</h3>
              <p className="text-sm text-muted-foreground">{searchTerm ? 'Essayez de modifier vos critères.' : 'Aucun prix soumis.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingPrice} onOpenChange={(open) => !open && setEditingPrice(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le prix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Produit</Label><Input value={editForm.product} onChange={e => setEditForm(f => ({ ...f, product: e.target.value }))} /></div>
            <div><Label>Catégorie</Label><Input value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prix</Label><Input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Unité</Label><Input value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} /></div>
            </div>
            <div><Label>Vendeur</Label><Input value={editForm.vendor} onChange={e => setEditForm(f => ({ ...f, vendor: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ville</Label><Input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} /></div>
              <div><Label>Marché</Label><Input value={editForm.market} onChange={e => setEditForm(f => ({ ...f, market: e.target.value }))} /></div>
            </div>
            <div><Label>Île</Label><Input value={editForm.island} onChange={e => setEditForm(f => ({ ...f, island: e.target.value }))} /></div>
            <div>
              <Label>Tendance</Label>
              <Select value={editForm.trend} onValueChange={v => setEditForm(f => ({ ...f, trend: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="up">En hausse</SelectItem>
                  <SelectItem value="down">En baisse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPrice(null)}>Annuler</Button>
            <Button onClick={handleEditSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricesManagementSection;