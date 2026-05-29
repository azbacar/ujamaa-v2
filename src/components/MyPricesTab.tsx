import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DollarSign, MapPin, Calendar, Edit3, Loader2, Send, Clock, Plus, Copy,
  Eye, EyeOff, Trash2, Search, TrendingUp, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import PriceSubmissionForm from '@/components/PriceSubmissionForm';

interface PriceItem {
  id: string;
  product: string;
  price: number;
  currency: string;
  category: string;
  unit: string;
  vendor: string;
  city: string;
  island: string;
  village: string | null;
  market: string;
  status: string;
  views: number | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  merchant_type: string | null;
  created_at: string;
  updated_at: string;
}

interface PendingUpdate {
  id: string;
  title: string;
  status: string;
  created_at: string;
  review_notes: string | null;
  content: any;
}

export default function MyPricesTab() {
  const { user } = useAuth();
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<PriceItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showForm, setShowForm] = useState(false);
  const [formDefaults, setFormDefaults] = useState<any>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<PriceItem | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [pricesRes, updatesRes] = await Promise.all([
      supabase
        .from('prices')
        .select('id, product, price, currency, category, unit, vendor, city, island, village, market, status, views, image_url, latitude, longitude, merchant_type, created_at, updated_at')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('pending_modifications')
        .select('id, title, status, created_at, review_notes, content')
        .eq('submitted_by', user.id)
        .eq('type', 'price_update')
        .order('created_at', { ascending: false }),
    ]);
    setPrices((pricesRes.data || []) as PriceItem[]);
    setPendingUpdates((updatesRes.data || []) as PendingUpdate[]);
    setLoading(false);
  };

  // Stats
  const stats = useMemo(() => {
    const published = prices.filter(p => p.status === 'published').length;
    const draft = prices.filter(p => p.status === 'draft').length;
    const totalViews = prices.reduce((s, p) => s + (p.views || 0), 0);
    return { published, draft, totalViews, total: prices.length };
  }, [prices]);

  // Filtered list
  const filtered = useMemo(() => {
    return prices.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search && !`${p.product} ${p.vendor} ${p.market} ${p.city}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [prices, search, statusFilter]);

  // Build defaults from most recent price (vendor + location)
  const buildDefaults = (source?: PriceItem) => {
    const src = source || prices[0];
    if (!src) return undefined;
    return {
      vendorName: src.vendor,
      market: src.market,
      village: src.village || '',
      city: src.city,
      island: src.island,
      latitude: src.latitude?.toString() || '',
      longitude: src.longitude?.toString() || '',
      merchantType: (src.merchant_type as 'fixed' | 'ambulant') || 'fixed',
      category: source ? src.category : '',
      unit: source ? src.unit : '',
      currency: src.currency,
      productName: source ? src.product : '',
      price: source ? src.price.toString() : '',
    };
  };

  const handleAddNew = () => {
    setFormDefaults(buildDefaults());
    setShowForm(true);
  };

  const handleDuplicate = (p: PriceItem) => {
    setFormDefaults(buildDefaults(p));
    setShowForm(true);
  };

  const handleToggleStatus = async (p: PriceItem) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('prices').update({ status: newStatus }).eq('id', p.id);
    if (error) {
      toast.error("Impossible de modifier le statut");
      return;
    }
    toast.success(newStatus === 'published' ? 'Prix publié' : 'Prix dépublié');
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('prices').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    toast.success("Prix supprimé");
    setDeleteTarget(null);
    fetchData();
  };

  const handleSubmitUpdate = async () => {
    if (!user || !editingPrice || !newPrice) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('pending_modifications').insert({
        submitted_by: user.id,
        type: 'price_update',
        title: `Mise à jour prix: ${editingPrice.product}`,
        content: {
          price_id: editingPrice.id,
          product: editingPrice.product,
          old_price: editingPrice.price,
          new_price: parseFloat(newPrice),
          currency: editingPrice.currency,
          unit: editingPrice.unit,
          reason,
        },
      } as any);
      if (error) throw error;
      toast.success('Demande de mise à jour soumise !');
      setEditingPrice(null);
      setNewPrice('');
      setReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Publié</Badge>;
      case 'draft': return <Badge variant="secondary">Brouillon</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">En attente</Badge>;
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Approuvé</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeté</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total prix</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-emerald-500 opacity-50" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Publiés</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.published}</p>
            </div>
            <Eye className="h-8 w-8 text-emerald-500 opacity-50" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Brouillons</p>
              <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
            </div>
            <EyeOff className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Vues totales</p>
              <p className="text-2xl font-bold text-ocean-600">{stats.totalViews.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-ocean-500 opacity-50" />
          </div>
        </CardContent></Card>
      </div>

      {/* Boutique header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Ma boutique de prix
              </CardTitle>
              <CardDescription>
                Gérez vos prix comme une boutique — Vendeur, marché et localisation seront pré-remplis à chaque ajout.
              </CardDescription>
            </div>
            <Button onClick={handleAddNew} className="bg-gradient-to-r from-emerald-500 to-ocean-500">
              <Plus className="h-4 w-4 mr-1" /> Ajouter un prix
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          {prices.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit, marché..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'published', 'draft'] as const).map(s => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'Tous' : s === 'published' ? 'Publiés' : 'Brouillons'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {prices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Aucun prix dans votre boutique</p>
              <p className="text-xs mt-1 mb-4">Ajoutez votre premier prix — les suivants seront ultra rapides à saisir</p>
              <Button onClick={handleAddNew} className="bg-gradient-to-r from-emerald-500 to-ocean-500">
                <Plus className="h-4 w-4 mr-1" /> Ajouter mon premier prix
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucun prix ne correspond à votre recherche.
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.map(price => (
                <div key={price.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  {price.image_url ? (
                    <img src={price.image_url} alt={price.product} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-emerald-100 to-ocean-100 flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-emerald-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{price.product}</p>
                      <Badge variant="outline" className="text-xs">{price.category}</Badge>
                      {getStatusBadge(price.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-primary">
                        {price.price.toLocaleString()} {price.currency}/{price.unit}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {price.market}, {price.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {price.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(price.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Demander une mise à jour de prix"
                      onClick={() => {
                        setEditingPrice(price);
                        setNewPrice(price.price.toString());
                        setReason('');
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Dupliquer" onClick={() => handleDuplicate(price)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title={price.status === 'published' ? 'Dépublier' : 'Publier'}
                      onClick={() => handleToggleStatus(price)}
                    >
                      {price.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Supprimer"
                      onClick={() => setDeleteTarget(price)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending updates */}
      {pendingUpdates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Demandes de mise à jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingUpdates.map(upd => (
                <div key={upd.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{upd.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(upd.content as any)?.old_price?.toLocaleString()} → {(upd.content as any)?.new_price?.toLocaleString()} {(upd.content as any)?.currency}
                    </p>
                    {upd.review_notes && (
                      <p className="text-xs text-amber-600 mt-1">Note: {upd.review_notes}</p>
                    )}
                  </div>
                  {getStatusBadge(upd.status || 'pending')}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New / duplicate form */}
      {showForm && (
        <PriceSubmissionForm
          defaults={formDefaults}
          onClose={() => setShowForm(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingPrice} onOpenChange={(open) => !open && setEditingPrice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une mise à jour de prix</DialogTitle>
          </DialogHeader>
          {editingPrice && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium">{editingPrice.product}</p>
                <p className="text-sm text-muted-foreground">
                  Prix actuel : {editingPrice.price.toLocaleString()} {editingPrice.currency}/{editingPrice.unit}
                </p>
                <p className="text-xs text-muted-foreground">
                  {editingPrice.market}, {editingPrice.city} — {editingPrice.island}
                </p>
              </div>
              <div>
                <Label>Nouveau prix ({editingPrice.currency})</Label>
                <Input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  placeholder="Nouveau prix"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Raison de la modification (optionnel)</Label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Ex: Le prix a augmenté au marché..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPrice(null)}>Annuler</Button>
            <Button onClick={handleSubmitUpdate} disabled={submitting || !newPrice}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Soumettre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce prix ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.product} — {deleteTarget?.price.toLocaleString()} {deleteTarget?.currency}/{deleteTarget?.unit}
              <br /> Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
