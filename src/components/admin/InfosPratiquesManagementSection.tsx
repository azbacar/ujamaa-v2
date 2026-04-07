import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Car, Cross, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface TaxiFare {
  id: string;
  from_location: string;
  to_location: string;
  island: string;
  price: number;
  currency: string;
  vehicle_type: string;
  notes: string | null;
  is_active: boolean;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  island: string;
  city: string | null;
  is_on_duty: boolean;
  duty_start: string | null;
  duty_end: string | null;
  notes: string | null;
  is_active: boolean;
}

const ISLANDS = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];

export default function InfosPratiquesManagementSection() {
  const { user } = useAuth();
  const [taxiFares, setTaxiFares] = useState<TaxiFare[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  // Taxi form
  const [taxiForm, setTaxiForm] = useState({ from_location: '', to_location: '', island: 'Grande Comore', price: '', vehicle_type: 'taxi', notes: '' });
  const [editingTaxi, setEditingTaxi] = useState<string | null>(null);

  // Pharmacy form
  const [pharmaForm, setPharmaForm] = useState({ name: '', address: '', phone: '', island: 'Grande Comore', city: '', duty_start: '', duty_end: '', is_on_duty: false, notes: '' });
  const [editingPharma, setEditingPharma] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [t, p] = await Promise.all([
      supabase.from('taxi_fares').select('*').order('island').order('from_location'),
      supabase.from('pharmacy_guards').select('*').order('island').order('name'),
    ]);
    setTaxiFares((t.data as any) || []);
    setPharmacies((p.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // TAXI CRUD
  const handleSaveTaxi = async () => {
    if (!taxiForm.from_location || !taxiForm.to_location || !taxiForm.price) {
      toast.error('Remplissez départ, arrivée et prix'); return;
    }
    const payload = {
      from_location: taxiForm.from_location,
      to_location: taxiForm.to_location,
      island: taxiForm.island,
      price: parseFloat(taxiForm.price),
      vehicle_type: taxiForm.vehicle_type,
      notes: taxiForm.notes || null,
      created_by: user?.id,
    };

    if (editingTaxi) {
      const { error } = await supabase.from('taxi_fares').update(payload).eq('id', editingTaxi);
      if (error) { toast.error('Erreur modification'); return; }
      toast.success('Trajet modifié');
      setEditingTaxi(null);
    } else {
      const { error } = await supabase.from('taxi_fares').insert(payload);
      if (error) { toast.error('Erreur ajout'); return; }
      toast.success('Trajet ajouté');
    }
    setTaxiForm({ from_location: '', to_location: '', island: 'Grande Comore', price: '', vehicle_type: 'taxi', notes: '' });
    fetchData();
  };

  const deleteTaxi = async (id: string) => {
    await supabase.from('taxi_fares').delete().eq('id', id);
    toast.success('Trajet supprimé');
    fetchData();
  };

  const editTaxi = (t: TaxiFare) => {
    setEditingTaxi(t.id);
    setTaxiForm({ from_location: t.from_location, to_location: t.to_location, island: t.island, price: String(t.price), vehicle_type: t.vehicle_type, notes: t.notes || '' });
  };

  // PHARMACY CRUD
  const handleSavePharma = async () => {
    if (!pharmaForm.name) { toast.error('Nom requis'); return; }
    const payload = {
      name: pharmaForm.name,
      address: pharmaForm.address || null,
      phone: pharmaForm.phone || null,
      island: pharmaForm.island,
      city: pharmaForm.city || null,
      is_on_duty: pharmaForm.is_on_duty,
      duty_start: pharmaForm.duty_start || null,
      duty_end: pharmaForm.duty_end || null,
      notes: pharmaForm.notes || null,
      created_by: user?.id,
    };

    if (editingPharma) {
      const { error } = await supabase.from('pharmacy_guards').update(payload).eq('id', editingPharma);
      if (error) { toast.error('Erreur modification'); return; }
      toast.success('Pharmacie modifiée');
      setEditingPharma(null);
    } else {
      const { error } = await supabase.from('pharmacy_guards').insert(payload);
      if (error) { toast.error('Erreur ajout'); return; }
      toast.success('Pharmacie ajoutée');
    }
    setPharmaForm({ name: '', address: '', phone: '', island: 'Grande Comore', city: '', duty_start: '', duty_end: '', is_on_duty: false, notes: '' });
    fetchData();
  };

  const deletePharma = async (id: string) => {
    await supabase.from('pharmacy_guards').delete().eq('id', id);
    toast.success('Pharmacie supprimée');
    fetchData();
  };

  const editPharma = (p: Pharmacy) => {
    setEditingPharma(p.id);
    setPharmaForm({
      name: p.name, address: p.address || '', phone: p.phone || '',
      island: p.island, city: p.city || '',
      duty_start: p.duty_start ? p.duty_start.slice(0, 16) : '',
      duty_end: p.duty_end ? p.duty_end.slice(0, 16) : '',
      is_on_duty: p.is_on_duty, notes: p.notes || '',
    });
  };

  const toggleDuty = async (id: string, current: boolean) => {
    await supabase.from('pharmacy_guards').update({ is_on_duty: !current }).eq('id', id);
    toast.success(!current ? 'Pharmacie mise de garde' : 'Garde désactivée');
    fetchData();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-xl font-bold">📋 Infos Pratiques — Taxis & Pharmacies</h2>

      <Tabs defaultValue="taxi" className="space-y-4">
        <TabsList>
          <TabsTrigger value="taxi"><Car className="h-4 w-4 mr-1" /> Tarifs Taxi ({taxiFares.length})</TabsTrigger>
          <TabsTrigger value="pharmacy"><Cross className="h-4 w-4 mr-1" /> Pharmacies ({pharmacies.length})</TabsTrigger>
        </TabsList>

        {/* TAXI TAB */}
        <TabsContent value="taxi" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{editingTaxi ? 'Modifier le trajet' : 'Ajouter un trajet'}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input placeholder="Départ (ex: Moroni)" value={taxiForm.from_location} onChange={e => setTaxiForm(f => ({ ...f, from_location: e.target.value }))} />
                <Input placeholder="Arrivée (ex: Mitsamiouli)" value={taxiForm.to_location} onChange={e => setTaxiForm(f => ({ ...f, to_location: e.target.value }))} />
                <Input placeholder="Prix (FC)" type="number" value={taxiForm.price} onChange={e => setTaxiForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={taxiForm.island} onValueChange={v => setTaxiForm(f => ({ ...f, island: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={taxiForm.vehicle_type} onValueChange={v => setTaxiForm(f => ({ ...f, vehicle_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taxi">Taxi</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="taxi-brousse">Taxi-brousse</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Notes (optionnel)" value={taxiForm.notes} onChange={e => setTaxiForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveTaxi}><Plus className="h-4 w-4 mr-1" /> {editingTaxi ? 'Modifier' : 'Ajouter'}</Button>
                {editingTaxi && <Button variant="outline" onClick={() => { setEditingTaxi(null); setTaxiForm({ from_location: '', to_location: '', island: 'Grande Comore', price: '', vehicle_type: 'taxi', notes: '' }); }}>Annuler</Button>}
              </div>
            </CardContent>
          </Card>

          {loading ? <p>Chargement...</p> : (
            <div className="space-y-2">
              {taxiFares.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{t.from_location} → {t.to_location}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{t.island}</Badge>
                      <span className="text-sm font-bold text-primary">{t.price.toLocaleString()} FC</span>
                      {t.vehicle_type !== 'taxi' && <Badge variant="secondary" className="text-xs">{t.vehicle_type}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => editTaxi(t)}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteTaxi(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* PHARMACY TAB */}
        <TabsContent value="pharmacy" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{editingPharma ? 'Modifier la pharmacie' : 'Ajouter une pharmacie'}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input placeholder="Nom de la pharmacie" value={pharmaForm.name} onChange={e => setPharmaForm(f => ({ ...f, name: e.target.value }))} />
                <Input placeholder="Adresse" value={pharmaForm.address} onChange={e => setPharmaForm(f => ({ ...f, address: e.target.value }))} />
                <Input placeholder="Téléphone" value={pharmaForm.phone} onChange={e => setPharmaForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={pharmaForm.island} onValueChange={v => setPharmaForm(f => ({ ...f, island: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Ville" value={pharmaForm.city} onChange={e => setPharmaForm(f => ({ ...f, city: e.target.value }))} />
                <div className="flex items-center gap-2">
                  <Switch checked={pharmaForm.is_on_duty} onCheckedChange={v => setPharmaForm(f => ({ ...f, is_on_duty: v }))} id="duty" />
                  <Label htmlFor="duty">De garde</Label>
                </div>
              </div>
              {pharmaForm.is_on_duty && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Début de garde</Label>
                    <Input type="datetime-local" value={pharmaForm.duty_start} onChange={e => setPharmaForm(f => ({ ...f, duty_start: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Fin de garde</Label>
                    <Input type="datetime-local" value={pharmaForm.duty_end} onChange={e => setPharmaForm(f => ({ ...f, duty_end: e.target.value }))} />
                  </div>
                </div>
              )}
              <Textarea placeholder="Notes (optionnel)" value={pharmaForm.notes} onChange={e => setPharmaForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              <div className="flex gap-2">
                <Button onClick={handleSavePharma}><Plus className="h-4 w-4 mr-1" /> {editingPharma ? 'Modifier' : 'Ajouter'}</Button>
                {editingPharma && <Button variant="outline" onClick={() => { setEditingPharma(null); setPharmaForm({ name: '', address: '', phone: '', island: 'Grande Comore', city: '', duty_start: '', duty_end: '', is_on_duty: false, notes: '' }); }}>Annuler</Button>}
              </div>
            </CardContent>
          </Card>

          {loading ? <p>Chargement...</p> : (
            <div className="space-y-2">
              {pharmacies.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      {p.is_on_duty ? (
                        <Badge className="bg-green-100 text-green-700">🟢 De garde</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {p.city && <span>{p.city}</span>}
                      <span>{p.island}</span>
                      {p.phone && <span>📞 {p.phone}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant={p.is_on_duty ? 'destructive' : 'default'} onClick={() => toggleDuty(p.id, p.is_on_duty)} className="text-xs">
                      {p.is_on_duty ? 'Fin garde' : 'Mettre de garde'}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => editPharma(p)}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deletePharma(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
