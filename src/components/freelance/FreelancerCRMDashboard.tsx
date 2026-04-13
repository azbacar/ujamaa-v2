import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import {
  UserCircle, Receipt, Calculator, Plus, Trash2, Send, CheckCircle, Clock,
  FileText, DollarSign
} from 'lucide-react';
import { useFreelanceCRM, FreelancerClient, FreelancerInvoice } from '@/hooks/useFreelanceCRM';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  freelancerId: string;
}

export default function FreelancerCRMDashboard({ freelancerId }: Props) {
  const crm = useFreelanceCRM(freelancerId);

  if (crm.loading) return <div className="animate-pulse p-8 text-center text-muted-foreground">Chargement CRM...</div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-primary/60" />
          <div><p className="text-2xl font-bold">{crm.clients.length}</p><p className="text-xs text-muted-foreground">Clients</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Receipt className="h-8 w-8 text-green-600/60" />
          <div><p className="text-2xl font-bold">{crm.invoices.length}</p><p className="text-xs text-muted-foreground">Factures</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-blue-600/60" />
          <div><p className="text-2xl font-bold">{crm.balance.toLocaleString()} FC</p><p className="text-xs text-muted-foreground">Solde</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-yellow-600/60" />
          <div><p className="text-2xl font-bold">{crm.unpaidTotal.toLocaleString()} FC</p><p className="text-xs text-muted-foreground">Impayés</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="w-full flex flex-wrap">
          <TabsTrigger value="clients" className="gap-1"><UserCircle className="h-4 w-4" /> Clients</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1"><Receipt className="h-4 w-4" /> Factures</TabsTrigger>
          <TabsTrigger value="accounting" className="gap-1"><Calculator className="h-4 w-4" /> Comptabilité</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <ClientsTab clients={crm.clients} onAdd={crm.addClient} onDelete={crm.deleteClient} />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab invoices={crm.invoices} clients={crm.clients} onAdd={crm.addInvoice} onUpdate={crm.updateInvoice} onDelete={crm.deleteInvoice} />
        </TabsContent>
        <TabsContent value="accounting">
          <AccountingTab
            transactions={crm.transactions}
            totalIncome={crm.totalIncome}
            totalExpense={crm.totalExpense}
            balance={crm.balance}
            unpaidTotal={crm.unpaidTotal}
            onAdd={crm.addTransaction}
            onDelete={crm.deleteTransaction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientsTab({ clients, onAdd, onDelete }: {
  clients: FreelancerClient[];
  onAdd: (c: Partial<FreelancerClient>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '', linked_email: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    try {
      let linked_user_id: string | null = null;
      if (form.linked_email.trim()) {
        const { data } = await supabase.from('users').select('id').eq('email', form.linked_email.trim()).maybeSingle();
        if (data) linked_user_id = data.id;
      }
      await onAdd({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
        linked_user_id,
      } as any);
      toast.success('Client ajouté');
      setForm({ name: '', email: '', phone: '', address: '', notes: '', linked_email: '' });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Clients ({clients.length})</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="h-4 w-4" /> Nouveau client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un client</DialogTitle>
              <DialogDescription>Renseignez les informations de votre client</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Nom *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>Adresse</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Lier à un utilisateur UJAMAA (email)</Label>
                <Input placeholder="utilisateur@email.com" value={form.linked_email} onChange={e => setForm(p => ({ ...p, linked_email: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Si renseigné, ce client recevra ses factures sur la plateforme</p>
              </div>
              <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
              <Button onClick={handleAdd} disabled={saving} className="w-full">{saving ? 'Ajout...' : 'Ajouter'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun client</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {clients.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{[c.email, c.phone].filter(Boolean).join(' • ') || 'Pas de contact'}</p>
                  {c.linked_user_id && <Badge variant="secondary" className="mt-1 text-xs">Utilisateur UJAMAA</Badge>}
                </div>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { onDelete(c.id); toast.success('Client supprimé'); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoicesTab({ invoices, clients, onAdd, onUpdate, onDelete }: {
  invoices: FreelancerInvoice[];
  clients: FreelancerClient[];
  onAdd: (i: Partial<FreelancerInvoice>) => Promise<void>;
  onUpdate: (id: string, u: Partial<FreelancerInvoice>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: '', type: 'invoice', items: [{ description: '', quantity: 1, unit_price: 0 }],
    tax_rate: 0, currency: 'FC', due_date: '', notes: '', payment_method: 'mvola',
  });
  const [saving, setSaving] = useState(false);

  const subtotal = form.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxAmount = subtotal * (form.tax_rate / 100);
  const total = subtotal + taxAmount;

  const handleAdd = async () => {
    if (form.items.every(i => !i.description.trim())) { toast.error('Ajoutez au moins un article'); return; }
    setSaving(true);
    try {
      const client = clients.find(c => c.id === form.client_id);
      const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
      await onAdd({
        client_id: form.client_id || null,
        linked_user_id: client?.linked_user_id || null,
        invoice_number: invNum,
        type: form.type,
        status: 'draft',
        items: form.items.filter(i => i.description.trim()),
        subtotal,
        tax_rate: form.tax_rate,
        tax_amount: taxAmount,
        total,
        currency: form.currency,
        due_date: form.due_date || null,
        notes: form.notes || null,
        payment_method: form.payment_method || null,
      } as any);
      toast.success('Facture créée');
      setForm({ client_id: '', type: 'invoice', items: [{ description: '', quantity: 1, unit_price: 0 }], tax_rate: 0, currency: 'FC', due_date: '', notes: '', payment_method: 'mvola' });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
    setSaving(false);
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500', sent: 'bg-blue-500', paid: 'bg-green-500', overdue: 'bg-red-500', cancelled: 'bg-gray-400',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Factures ({invoices.length})</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="h-4 w-4" /> Nouvelle facture</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une facture</DialogTitle>
              <DialogDescription>Sélectionnez un client et ajoutez les articles</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Client</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Facture</SelectItem>
                      <SelectItem value="quote">Devis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Articles</Label>
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input className="flex-1" placeholder="Description" value={item.description} onChange={e => {
                      const items = [...form.items]; items[idx].description = e.target.value; setForm(p => ({ ...p, items }));
                    }} />
                    <Input className="w-16" type="number" placeholder="Qté" value={item.quantity} onChange={e => {
                      const items = [...form.items]; items[idx].quantity = Number(e.target.value); setForm(p => ({ ...p, items }));
                    }} />
                    <Input className="w-24" type="number" placeholder="Prix" value={item.unit_price} onChange={e => {
                      const items = [...form.items]; items[idx].unit_price = Number(e.target.value); setForm(p => ({ ...p, items }));
                    }} />
                    {form.items.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, items: [...p.items, { description: '', quantity: 1, unit_price: 0 }] }))}>
                  <Plus className="h-3 w-3 mr-1" /> Article
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>Taxe %</Label><Input type="number" value={form.tax_rate} onChange={e => setForm(p => ({ ...p, tax_rate: Number(e.target.value) }))} /></div>
                <div className="space-y-1">
                  <Label>Devise</Label>
                  <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FC">FC</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Paiement</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm(p => ({ ...p, payment_method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mvola">Mvola</SelectItem>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="bank">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1"><Label>Échéance</Label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Sous-total</span><span>{subtotal.toLocaleString()} {form.currency}</span></div>
                {form.tax_rate > 0 && <div className="flex justify-between"><span>Taxe ({form.tax_rate}%)</span><span>{taxAmount.toLocaleString()} {form.currency}</span></div>}
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{total.toLocaleString()} {form.currency}</span></div>
              </div>

              <Button onClick={handleAdd} disabled={saving} className="w-full">{saving ? 'Création...' : 'Créer la facture'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {invoices.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune facture</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <Card key={inv.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{inv.invoice_number}</p>
                      <Badge className={`${statusColors[inv.status] || 'bg-gray-500'} text-white text-xs`}>{statusLabels[inv.status] || inv.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{(inv.client as any)?.name || 'Client non renseigné'} • {new Date(inv.issue_date).toLocaleDateString('fr-FR')}</p>
                    <p className="text-lg font-bold mt-1">{Number(inv.total).toLocaleString()} {inv.currency}</p>
                  </div>
                  <div className="flex gap-1">
                    {inv.status === 'draft' && (
                      <Button variant="outline" size="sm" onClick={async () => { await onUpdate(inv.id, { status: 'sent' }); toast.success('Facture envoyée'); }}>
                        <Send className="h-3 w-3 mr-1" /> Envoyer
                      </Button>
                    )}
                    {(inv.status === 'sent' || inv.status === 'overdue') && (
                      <Button variant="outline" size="sm" className="text-green-600" onClick={async () => { await onUpdate(inv.id, { status: 'paid', paid_at: new Date().toISOString() }); toast.success('Facture marquée payée'); }}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Payée
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { onDelete(inv.id); toast.success('Facture supprimée'); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountingTab({ transactions, totalIncome, totalExpense, balance, unpaidTotal, onAdd, onDelete }: {
  transactions: any[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  unpaidTotal: number;
  onAdd: (t: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'income', category: 'service', description: '', amount: '', currency: 'FC', payment_method: 'mvola', transaction_date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.description.trim() || !form.amount) { toast.error('Description et montant requis'); return; }
    setSaving(true);
    try {
      await onAdd({ ...form, amount: parseFloat(form.amount) });
      toast.success('Transaction ajoutée');
      setForm({ type: 'income', category: 'service', description: '', amount: '', currency: 'FC', payment_method: 'mvola', transaction_date: new Date().toISOString().split('T')[0] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{totalIncome.toLocaleString()}</p><p className="text-xs text-muted-foreground">Revenus (FC)</p></CardContent></Card>
        <Card className="border-red-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{totalExpense.toLocaleString()}</p><p className="text-xs text-muted-foreground">Dépenses (FC)</p></CardContent></Card>
        <Card className="border-blue-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{balance.toLocaleString()}</p><p className="text-xs text-muted-foreground">Solde (FC)</p></CardContent></Card>
        <Card className="border-yellow-200"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{unpaidTotal.toLocaleString()}</p><p className="text-xs text-muted-foreground">Impayés (FC)</p></CardContent></Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transactions</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> Transaction</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle transaction</DialogTitle>
              <DialogDescription>Enregistrez un revenu ou une dépense</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Revenu</SelectItem>
                      <SelectItem value="expense">Dépense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Catégorie</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="product">Produit</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="materiel">Matériel</SelectItem>
                      <SelectItem value="general">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label>Description *</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Montant *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.transaction_date} onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))} /></div>
              </div>
              <div className="space-y-1">
                <Label>Mode de paiement</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(p => ({ ...p, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mvola">Mvola</SelectItem>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="bank">Virement bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={saving} className="w-full">{saving ? 'Ajout...' : 'Ajouter'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {transactions.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune transaction</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((t: any) => (
            <Card key={t.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString('fr-FR')} • {t.category} • {t.payment_method || '-'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()} {t.currency}
                  </span>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => { onDelete(t.id); toast.success('Supprimé'); }}>
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
