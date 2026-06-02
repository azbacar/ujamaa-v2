import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, FileText, Send, CheckCircle, Smartphone, Pencil, Eye, Download, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { EnterpriseInvoice, InvoiceItem, EnterpriseClient } from '@/hooks/useEnterpriseCRM';
import type { EnterpriseProfile } from '@/hooks/useEnterprise';
import MvolaPaymentDialog from '@/components/MvolaPaymentDialog';
import { downloadInvoicePdf, invoicePdfBase64 } from '@/lib/invoicePdf';
import { supabase } from '@/integrations/supabase/client';

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
  enterprise: EnterpriseProfile;
  onAdd: (inv: Partial<EnterpriseInvoice>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<EnterpriseInvoice>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EMPTY_FORM = {
  client_id: '', type: 'invoice', invoice_number: '', due_date: '', notes: '', tax_rate: '0',
  items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }] as InvoiceItem[],
};

export default function CRMInvoicesTab({ invoices, clients, enterprise, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<EnterpriseInvoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<EnterpriseInvoice | null>(null);
  const [emailInvoice, setEmailInvoice] = useState<EnterpriseInvoice | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const clientOf = (id: string | null) => clients.find(c => c.id === id);

  const openEdit = (inv: EnterpriseInvoice) => {
    setEditingId(inv.id);
    setForm({
      client_id: inv.client_id || '',
      type: inv.type,
      invoice_number: inv.invoice_number,
      due_date: inv.due_date || '',
      notes: inv.notes || '',
      tax_rate: String(inv.tax_rate || 0),
      items: Array.isArray(inv.items) && inv.items.length ? inv.items : EMPTY_FORM.items,
    });
    setShowForm(true);
  };

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

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.invoice_number.trim()) { toast.error('Numéro requis'); return; }
    if (form.items.length === 0 || !form.items[0].description) { toast.error('Ajoutez au moins un article'); return; }
    setSaving(true);
    try {
      const payload: Partial<EnterpriseInvoice> = {
        client_id: form.client_id || null,
        type: form.type as any,
        invoice_number: form.invoice_number.trim(),
        due_date: form.due_date || null,
        items: form.items as any,
        subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
        notes: form.notes.trim() || null,
      };
      if (editingId) {
        await onUpdate(editingId, payload);
        toast.success('Document mis à jour');
      } else {
        await onAdd(payload);
        toast.success('Document créé');
      }
      resetForm();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    }
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

  const handleDownload = async (inv: EnterpriseInvoice) => {
    const c = clientOf(inv.client_id);
    try {
      await downloadInvoicePdf(inv, enterprise, c ? { name: c.name, email: c.email, phone: c.phone, address: c.address } : undefined);
      toast.success('PDF téléchargé');
    } catch (e: any) {
      toast.error('Erreur PDF : ' + e.message);
    }
  };

  const openEmail = (inv: EnterpriseInvoice) => {
    const c = clientOf(inv.client_id);
    setEmailInvoice(inv);
    setEmailTo(c?.email || '');
    setEmailMessage(
      `Bonjour ${c?.name || ''},\n\nVeuillez trouver en pièce jointe ${TYPE_LABELS[inv.type].replace(/^\S+\s/, '').toLowerCase()} n° ${inv.invoice_number} d'un montant de ${Number(inv.total).toLocaleString('fr-FR')} ${inv.currency}.\n\nCordialement,\n${enterprise.name}`
    );
  };

  const sendEmail = async () => {
    if (!emailInvoice || !emailTo.trim()) { toast.error('Email destinataire requis'); return; }
    setSendingEmail(true);
    try {
      const c = clientOf(emailInvoice.client_id);
      const pdf_base64 = await invoicePdfBase64(emailInvoice, enterprise, c ? { name: c.name, email: c.email, phone: c.phone, address: c.address } : undefined);
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          to: emailTo.trim(),
          subject: `${TYPE_LABELS[emailInvoice.type].replace(/^\S+\s/, '')} ${emailInvoice.invoice_number} — ${enterprise.name}`,
          message: emailMessage,
          pdf_base64,
          filename: `${emailInvoice.invoice_number}.pdf`,
          from_name: enterprise.name,
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast.success('Email envoyé ✉️');
      if (emailInvoice.status === 'draft') await onUpdate(emailInvoice.id, { status: 'sent' });
      setEmailInvoice(null);
    } catch (e: any) {
      toast.error('Erreur envoi : ' + (e.message || 'inconnue'));
    }
    setSendingEmail(false);
  };

  const sendWhatsApp = async (inv: EnterpriseInvoice) => {
    const c = clientOf(inv.client_id);
    const phone = (c?.phone || '').replace(/[^\d]/g, '');
    const label = TYPE_LABELS[inv.type].replace(/^\S+\s/, '');
    const text = encodeURIComponent(
      `Bonjour ${c?.name || ''},\n\n${enterprise.name} vous envoie ${label.toLowerCase()} n° ${inv.invoice_number}\n` +
      `Montant : ${Number(inv.total).toLocaleString('fr-FR')} ${inv.currency}\n` +
      (inv.due_date ? `Échéance : ${new Date(inv.due_date).toLocaleDateString('fr-FR')}\n` : '') +
      `\nLe PDF complet vous sera transmis dans ce chat. Merci de votre confiance.`
    );
    // Télécharge aussi le PDF pour qu'il puisse être joint manuellement à WhatsApp
    await handleDownload(inv);
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener');
    toast.info('PDF téléchargé — joignez-le à votre conversation WhatsApp');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Factures & Devis</h3>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-1"><Plus className="h-4 w-4" /> Créer</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{editingId ? '✏️ Modifier' : '➕ Nouveau document'}</p>
              {editingId && <Badge variant="outline" className="text-[10px]">Mode édition</Badge>}
            </div>

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
                <Select value={form.client_id || 'none'} onValueChange={v => setForm(p => ({ ...p, client_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Aucun —</SelectItem>
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
              <Button onClick={handleSubmit} disabled={saving} size="sm">
                {saving ? 'Enregistrement...' : (editingId ? 'Enregistrer les modifications' : 'Créer')}
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm}>Annuler</Button>
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
                  <div className="flex items-start justify-between gap-3 flex-wrap">
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
                      <Button size="sm" variant="outline" onClick={() => setPreviewInvoice(inv)} className="gap-1">
                        <Eye className="h-3 w-3" /> Aperçu
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(inv)} className="gap-1">
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEmail(inv)} className="gap-1 text-blue-600">
                        <Mail className="h-3 w-3" /> Email
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => sendWhatsApp(inv)} className="gap-1 text-green-600">
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(inv)} className="gap-1">
                        <Pencil className="h-3 w-3" /> Modifier
                      </Button>
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

      {/* Mvola Payment */}
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

      {/* Aperçu */}
      <Dialog open={!!previewInvoice} onOpenChange={(o) => { if (!o) setPreviewInvoice(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu — {previewInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {previewInvoice && (
            <InvoicePreview inv={previewInvoice} enterprise={enterprise} client={clientOf(previewInvoice.client_id)} />
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewInvoice(null)}>Fermer</Button>
            {previewInvoice && (
              <Button onClick={() => handleDownload(previewInvoice)} className="gap-1">
                <Download className="h-4 w-4" /> Télécharger PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email dialog */}
      <Dialog open={!!emailInvoice} onOpenChange={(o) => { if (!o) setEmailInvoice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Envoyer par email</DialogTitle>
            <DialogDescription>Le PDF sera joint automatiquement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Destinataire *</Label>
              <Input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="client@exemple.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message</Label>
              <Textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailInvoice(null)} disabled={sendingEmail}>Annuler</Button>
            <Button onClick={sendEmail} disabled={sendingEmail} className="gap-1">
              <Mail className="h-4 w-4" /> {sendingEmail ? 'Envoi...' : 'Envoyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoicePreview({ inv, enterprise, client }: { inv: EnterpriseInvoice; enterprise: EnterpriseProfile; client?: EnterpriseClient }) {
  const items = Array.isArray(inv.items) ? inv.items : [];
  return (
    <div className="bg-white text-gray-900 p-6 rounded-lg border space-y-4 text-sm">
      <div className="flex items-start justify-between gap-4">
        {enterprise.logo_url ? (
          <img src={enterprise.logo_url} alt={enterprise.name} className="h-16 w-16 rounded object-cover" />
        ) : (
          <div className="h-16 w-16 rounded bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700">
            {enterprise.name.charAt(0)}
          </div>
        )}
        <div className="text-right text-xs">
          <p className="font-bold text-base">{enterprise.name}</p>
          {enterprise.address && <p>{enterprise.address}</p>}
          {(enterprise.city || enterprise.island) && <p>{[enterprise.city, enterprise.island].filter(Boolean).join(', ')}</p>}
          {enterprise.phone && <p>Tél : {enterprise.phone}</p>}
          {enterprise.email && <p>{enterprise.email}</p>}
          {enterprise.nif && <p>NIF : {enterprise.nif}</p>}
          {enterprise.rccm && <p>RCCM : {enterprise.rccm}</p>}
        </div>
      </div>

      <div className="border-t pt-3">
        <h2 className="text-lg font-bold text-emerald-700">
          {(TYPE_LABELS[inv.type] || '').replace(/^\S+\s/, '').toUpperCase()} N° {inv.invoice_number}
        </h2>
        <p className="text-xs text-gray-600">
          Émise le {new Date(inv.issue_date).toLocaleDateString('fr-FR')}
          {inv.due_date && ` • Échéance ${new Date(inv.due_date).toLocaleDateString('fr-FR')}`}
        </p>
      </div>

      {client && (
        <div>
          <p className="font-semibold">Facturé à :</p>
          <p>{client.name}</p>
          {client.address && <p className="text-xs">{client.address}</p>}
          {client.phone && <p className="text-xs">Tél : {client.phone}</p>}
          {client.email && <p className="text-xs">{client.email}</p>}
        </div>
      )}

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-emerald-700 text-white">
            <th className="text-left p-2">Description</th>
            <th className="p-2 w-12">Qté</th>
            <th className="p-2 w-20 text-right">PU</th>
            <th className="p-2 w-24 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{it.description}</td>
              <td className="p-2 text-center">{it.quantity}</td>
              <td className="p-2 text-right">{Number(it.unit_price).toLocaleString('fr-FR')}</td>
              <td className="p-2 text-right">{Number(it.total).toLocaleString('fr-FR')} {inv.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>Sous-total</span><span>{Number(inv.subtotal).toLocaleString('fr-FR')} {inv.currency}</span></div>
          {Number(inv.tax_rate) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>TVA ({inv.tax_rate}%)</span>
              <span>{Number(inv.tax_amount).toLocaleString('fr-FR')} {inv.currency}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-emerald-700 border-t pt-1 text-base">
            <span>TOTAL</span><span>{Number(inv.total).toLocaleString('fr-FR')} {inv.currency}</span>
          </div>
        </div>
      </div>

      {inv.notes && (
        <p className="text-xs italic text-gray-600 border-t pt-2">Notes : {inv.notes}</p>
      )}
    </div>
  );
}
