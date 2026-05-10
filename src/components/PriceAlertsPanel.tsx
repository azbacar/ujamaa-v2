import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, ArrowUpDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PriceAlert {
  id: string;
  product: string | null;
  category: string | null;
  island: string | null;
  threshold_type: string;
  threshold_value: number | null;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export default function PriceAlertsPanel() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newAlert, setNewAlert] = useState({
    product: '',
    category: '',
    island: '',
    threshold_type: 'any',
    threshold_value: '',
    notify_email: true,
    notify_whatsapp: false,
    whatsapp_phone: '',
  });

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setAlerts((data as PriceAlert[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('price_alerts').insert({
        user_id: user.id,
        product: newAlert.product || null,
        category: newAlert.category || null,
        island: newAlert.island || null,
        threshold_type: newAlert.threshold_type,
        threshold_value: newAlert.threshold_value ? Number(newAlert.threshold_value) : null,
        notify_email: newAlert.notify_email,
        notify_whatsapp: newAlert.notify_whatsapp,
        whatsapp_phone: newAlert.notify_whatsapp ? (newAlert.whatsapp_phone || null) : null,
      });
      if (error) throw error;
      toast.success('Alerte créée avec succès !');
      setShowForm(false);
      setNewAlert({ product: '', category: '', island: '', threshold_type: 'any', threshold_value: '', notify_email: true, notify_whatsapp: false, whatsapp_phone: '' });
      fetchAlerts();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAlert = async (id: string, active: boolean) => {
    await supabase.from('price_alerts').update({ is_active: active }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: active } : a));
  };

  const deleteAlert = async (id: string) => {
    await supabase.from('price_alerts').delete().eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alerte supprimée');
  };

  const thresholdIcon = (type: string) => {
    if (type === 'above') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (type === 'below') return <TrendingDown className="h-4 w-4 text-emerald-500" />;
    return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
  };

  const thresholdLabel = (type: string) => {
    if (type === 'above') return 'Au-dessus de';
    if (type === 'below') return 'En-dessous de';
    return 'Tout changement';
  };

  const CATEGORIES = ['Alimentation', 'Construction', 'Transport', 'Énergie', 'Textile', 'Électronique', 'Agriculture'];
  const ISLANDS = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" /> Alertes Prix
            </CardTitle>
            <CardDescription>Recevez des notifications en temps réel sur les prix</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" /> Nouvelle alerte
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Produit (optionnel)</Label>
                <Input
                  placeholder="Ex: Riz, Ciment..."
                  value={newAlert.product}
                  onChange={e => setNewAlert(p => ({ ...p, product: e.target.value }))}
                />
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={newAlert.category} onValueChange={v => setNewAlert(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes</SelectItem>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Île</Label>
                <Select value={newAlert.island} onValueChange={v => setNewAlert(p => ({ ...p, island: v }))}>
                  <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes</SelectItem>
                    {ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type d'alerte</Label>
                <Select value={newAlert.threshold_type} onValueChange={v => setNewAlert(p => ({ ...p, threshold_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Tout changement</SelectItem>
                    <SelectItem value="above">Prix au-dessus de...</SelectItem>
                    <SelectItem value="below">Prix en-dessous de...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newAlert.threshold_type !== 'any' && (
              <div>
                <Label>Seuil (FC)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 5000"
                  value={newAlert.threshold_value}
                  onChange={e => setNewAlert(p => ({ ...p, threshold_value: e.target.value }))}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Bell className="h-4 w-4 mr-1" />}
                Créer l'alerte
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <BellOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucune alerte configurée</p>
            <p className="text-xs mt-1">Créez une alerte pour être notifié des changements de prix</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3 min-w-0">
                  {thresholdIcon(alert.threshold_type)}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {alert.product || alert.category || 'Tous les produits'}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {alert.island && <Badge variant="outline" className="text-xs">{alert.island}</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {thresholdLabel(alert.threshold_type)}
                        {alert.threshold_value && ` ${alert.threshold_value.toLocaleString()} FC`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.is_active}
                    onCheckedChange={checked => toggleAlert(alert.id, checked)}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAlert(alert.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
