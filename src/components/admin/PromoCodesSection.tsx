import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tag, Plus, Trash2, Copy, Percent, DollarSign, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  applicable_plans: string[];
  created_at: string;
}

export default function PromoCodesSection() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: '',
    valid_until: '',
    applicable_plans: ['premium'],
  });

  useEffect(() => { fetchCodes(); }, []);

  const fetchCodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    setCodes((data as any[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error('Code requis'); return; }
    if (form.discount_value <= 0) { toast.error('Valeur de réduction invalide'); return; }

    const { error } = await supabase.from('promo_codes').insert({
      code: form.code.toUpperCase().trim(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      valid_until: form.valid_until || null,
      applicable_plans: form.applicable_plans,
      created_by: user!.id,
    } as any);

    if (error) {
      if (error.code === '23505') toast.error('Ce code existe déjà');
      else toast.error('Erreur: ' + error.message);
      return;
    }
    toast.success('Code promo créé !');
    setShowCreate(false);
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: 10, max_uses: '', valid_until: '', applicable_plans: ['premium'] });
    fetchCodes();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('promo_codes').update({ is_active: active } as any).eq('id', id);
    fetchCodes();
  };

  const deleteCode = async (id: string) => {
    await supabase.from('promo_codes').delete().eq('id', id);
    toast.success('Code supprimé');
    fetchCodes();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Tag className="h-5 w-5 text-primary" /> Codes Promotionnels
              </CardTitle>
              <CardDescription>{codes.length} code(s) · {codes.filter(c => c.is_active).length} actif(s)</CardDescription>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Nouveau code</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un code promo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Code *</Label>
                    <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EX: BIENVENUE20" className="mt-1 font-mono" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Promotion de lancement" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type de réduction</Label>
                      <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                          <SelectItem value="fixed">Montant fixe (FC)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valeur *</Label>
                      <Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Utilisations max (vide = illimité)</Label>
                      <Input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="∞" className="mt-1" />
                    </div>
                    <div>
                      <Label>Date d'expiration</Label>
                      <Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  <Button onClick={handleCreate} className="w-full">Créer le code promo</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : codes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucun code promo créé</p>
          ) : (
            <div className="space-y-3">
              {codes.map(code => (
                <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-primary">{code.code}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(code.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      {code.discount_type === 'percentage' ? (
                        <Badge variant="secondary" className="gap-1"><Percent className="h-3 w-3" />{code.discount_value}%</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1"><DollarSign className="h-3 w-3" />{code.discount_value.toLocaleString()} FC</Badge>
                      )}
                      {!code.is_active && <Badge variant="outline" className="text-red-500">Inactif</Badge>}
                    </div>
                    {code.description && <p className="text-xs text-muted-foreground">{code.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''} utilisé(s)</span>
                      {code.valid_until && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />Expire le {new Date(code.valid_until).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={code.is_active} onCheckedChange={v => toggleActive(code.id, v)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCode(code.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
