import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search, User, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { EnterpriseClient } from '@/hooks/useEnterpriseCRM';

interface Props {
  clients: EnterpriseClient[];
  onAdd: (c: Partial<EnterpriseClient>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CRMClientsTab({ clients, onAdd, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '', tags: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    try {
      await onAdd({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      toast.success('Client ajouté');
      setForm({ name: '', email: '', phone: '', address: '', notes: '', tags: '' });
      setShowForm(false);
    } catch { toast.error('Erreur'); }
    setSaving(false);
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1 shrink-0">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nom *</Label>
                <Input placeholder="Nom du client" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input placeholder="email@exemple.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Téléphone</Label>
                <Input placeholder="+269 3XX XX XX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Adresse</Label>
                <Input placeholder="Adresse" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tags (séparés par des virgules)</Label>
              <Input placeholder="vip, fidèle, entreprise" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Notes sur ce client..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={saving} size="sm">{saving ? 'Ajout...' : 'Ajouter le client'}</Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {clients.length === 0 ? 'Aucun client. Ajoutez votre premier client !' : 'Aucun résultat'}
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <Card key={client.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{client.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                        {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {client.email}</span>}
                        {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {client.phone}</span>}
                        {client.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {client.address}</span>}
                      </div>
                      {client.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {client.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" onClick={() => { if (confirm('Supprimer ce client ?')) onDelete(client.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
