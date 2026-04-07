import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, FileText, Send, CheckCircle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import type { EnterpriseInvoice, InvoiceItem, EnterpriseClient } from '@/hooks/useEnterpriseCRM';
import MvolaPaymentDialog from '@/components/MvolaPaymentDialog';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '📝 Brouillon', variant: 'secondary' },
  sent: { label: '📤 Envoyée', variant: 'outline' },
  paid: { label: '✅ Payée', variant: 'default' },
  overdue: { label: '⚠️ En retard', variant: 'destructive' },
  cancelled: { label: '❌ Annulée', variant: 'secondary' },
};

const TYPE_LABELS: Record<string, string> = {
  invoice: '🧾 Facture',
  quote: '📋 Devis',
  credit_note: '↩️ Avoir',
};

interface Props {
  invoices: EnterpriseInvoice[];
  clients: EnterpriseClient[];
  onAdd: (inv: Partial<EnterpriseInvoice>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<EnterpriseInvoice>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CRMInvoicesTab({ invoices, clients, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_id: '', type: 'invoice', invoice_number: '', due_date: '', notes: '', tax_rate: '0',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }] as InvoiceItem[],
  });
  const [saving, setSaving] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<EnterpriseInvoice | null>(null);

  const updateItem = (idx: number, field: string, value: any) => {
    setForm(prev => {
      const items = [...prev.items];
      (items[idx] as any)[field] = value;
      if (field === 'quantity' || field === 'unit_price') {
        items[idx].total = items[idx].quantity * items[idx].unit_price;
      }
      return { ...prev, items };
    });
  };

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }] }));
  const removeItem = (idx: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, i) => s + i.total, 0);
  const taxRate = parseFloat(form.tax_rate) || 0;
  const taxAmount = subtotal * taxRate / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!form.invoice_number.trim()) { toast.error('Numéro requis'); return; }
    if (form.items.length === 0 || !form.items[0].description) { toast.error('Ajoutez au moins un article'); return; }
    setSaving(true);
    try {
      await onAdd({
        client_id: form.client_id || null,
        type: form.type as any,
        invoice_number: form.invoice_number.trim(),
        due_date: form.due_date || null,
        items: form.items as any,
        subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
        notes: form.notes.trim() || null,
      });
      toast.success('Document créé');
      setForm({ client_id: '', type: 'invoice', invoice_number: '', due_date: '', notes: '', tax_rate: '0', items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }] });
      setShowForm(false);
    } catch { toast.error('Erreur'); }
    setSaving(false);
  };

  const markPaid = async (id: string) => {
    try {
      await onUpdate(id, { status: 'paid', paid_at: new Date().toISOString() } as any);
      toast.success('Facture marquée comme payée');
    } catch { toast.error('Erreur'); }
  };

  const handleInvoicePayment = async (method: 'mvola' | 'cash' | 'card', reference: string) => {
    if (!payingInvoice) return;
    await onUpdate(payingInvoice.id, { status: 'paid', paid_at: new Date().toISOString(), notes: `Paiement ${method}: ${reference}` } as any);
    toast.success('Paiement enregistré !');
    setPayingInvoice(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Factures & Devis</h3>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1"><Plus className="h-4 w-4" /> Créer</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Facture</SelectItem>
                    <SelectItem value="quote">Devis</SelectItem>
                    <SelectItem value="credit_note">Avoir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Numéro *</Label>
                <Input placeholder="FAC-2026-001" value={form.invoice_number} onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Client</Label>
                <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date d'échéance</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Taux TVA (%)</Label>
                <Input type="number" min="0" max="100" value={form.tax_rate} onChange={e => setForm(p => ({ ...p, tax_rate: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Articles</Label>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <Input className="flex-1" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  <Input className="w-16" type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                  <Input className="w-24" type="number" min="0" placeholder="Prix" value={item.unit_price || ''} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} />
                  <span className="text-sm font-medium w-20 text-right">{item.total.toLocaleString()} FC</span>
                  {form.items.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3 w-3" /> Article</Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Sous-total</span><span>{subtotal.toLocaleString()} FC</span></div>
              {taxRate > 0 && <div className="flex justify-between text-muted-foreground"><span>TVA ({taxRate}%)</span><span>{taxAmount.toLocaleString()} FC</span></div>}
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{total.toLocaleString()} FC</span></div>
            </div>

            <Textarea placeholder="Notes (optionnel)..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={saving} size="sm">{saving ? 'Création...' : 'Créer'}</Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {invoices.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune facture ou devis</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => {
            const st = STATUS_LABELS[inv.status] || STATUS_LABELS.draft;
            return (
              <Card key={inv.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold">{inv.invoice_number}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[inv.type]}</Badge>
                      </div>
                      {inv.client_name && <p className="text-sm text-muted-foreground mt-1">👤 {inv.client_name}</p>}
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="font-bold text-foreground">{Number(inv.total).toLocaleString()} {inv.currency}</span>
                        <span className="text-xs text-muted-foreground">{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 flex-wrap">
                      {(inv.status === 'sent' || inv.status === 'overdue') && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setPayingInvoice(inv)} className="gap-1 text-primary">
                            <Smartphone className="h-3 w-3" /> Payer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => markPaid(inv.id)} className="gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" /> Payée
                          </Button>
                        </>
                      )}
                      {inv.status === 'draft' && (
                        <Button size="sm" variant="outline" onClick={() => onUpdate(inv.id, { status: 'sent' })} className="gap-1">
                          <Send className="h-3 w-3" /> Envoyer
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Supprimer ?')) onDelete(inv.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mvola Payment for invoice */}
      {payingInvoice && (
        <MvolaPaymentDialog
          open={!!payingInvoice}
          onOpenChange={(o) => { if (!o) setPayingInvoice(null); }}
          amount={Number(payingInvoice.total)}
          currency={payingInvoice.currency}
          label={`Payer ${payingInvoice.invoice_number}`}
          userRef={payingInvoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}
          onPaymentSubmit={handleInvoicePayment}
        />
      )}
    </div>
  );
}
