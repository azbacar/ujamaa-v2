import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, MapPin, Calendar, Edit3, Loader2, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';

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
  market: string;
  status: string;
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

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [pricesRes, updatesRes] = await Promise.all([
      supabase
        .from('prices')
        .select('id, product, price, currency, category, unit, vendor, city, island, market, status, created_at, updated_at')
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
          reason: reason,
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
      case 'published': return <Badge className="bg-emerald-100 text-emerald-700">Publié</Badge>;
      case 'draft': return <Badge variant="secondary">Brouillon</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700">En attente</Badge>;
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-700">Approuvé</Badge>;
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Mes Prix Publiés
          </CardTitle>
          <CardDescription>
            {prices.length} prix soumis — Vous pouvez demander une mise à jour pour chaque prix
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Vous n'avez soumis aucun prix</p>
              <p className="text-xs mt-1">Rendez-vous sur la page des prix pour en ajouter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {prices.map(price => (
                <div key={price.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{price.product}</p>
                      <Badge variant="outline" className="text-xs">{price.category}</Badge>
                      {getStatusBadge(price.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">
                        {price.price.toLocaleString()} {price.currency}/{price.unit}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {price.city}, {price.island}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(price.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPrice(price);
                      setNewPrice(price.price.toString());
                      setReason('');
                    }}
                  >
                    <Edit3 className="h-3 w-3 mr-1" /> Modifier
                  </Button>
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
    </div>
  );
}
