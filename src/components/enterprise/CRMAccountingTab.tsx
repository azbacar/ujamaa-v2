import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { EnterpriseTransaction } from '@/hooks/useEnterpriseCRM';

const CATEGORIES = ['Ventes', 'Services', 'Loyer', 'Salaires', 'Fournitures', 'Transport', 'Marketing', 'Impôts', 'Autre'];

interface Props {
  transactions: EnterpriseTransaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  unpaidTotal: number;
  onAdd: (tx: Partial<EnterpriseTransaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CRMAccountingTab({ transactions, totalIncome, totalExpense, balance, unpaidTotal, onAdd, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'income', category: 'Ventes', description: '', amount: '', payment_method: '', reference: '', transaction_date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.description.trim() || !form.amount) { toast.error('Description et montant requis'); return; }
    setSaving(true);
    try {
      await onAdd({
        type: form.type as any,
        category: form.category,
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        payment_method: form.payment_method || null,
        reference: form.reference.trim() || null,
        transaction_date: form.transaction_date,
      });
      toast.success('Transaction ajoutée');
      setForm({ type: 'income', category: 'Ventes', description: '', amount: '', payment_method: '', reference: '', transaction_date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
    } catch { toast.error('Erreur'); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-600">{totalIncome.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Recettes (FC)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-6 w-6 text-red-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-600">{totalExpense.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Dépenses (FC)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-primary' : 'text-red-600'}`}>{balance.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Solde (FC)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-yellow-600">{unpaidTotal.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Impayés (FC)</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Transactions</h3>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1"><Plus className="h-4 w-4" /> Ajouter</Button>
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
                    <SelectItem value="income">💰 Recette</SelectItem>
                    <SelectItem value="expense">💸 Dépense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.transaction_date} onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Description *</Label>
                <Input placeholder="Description de la transaction" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Montant (FC) *</Label>
                <Input type="number" min="0" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Méthode de paiement</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(p => ({ ...p, payment_method: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="bank">Virement</SelectItem>
                    <SelectItem value="mobile">Mobile Money</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Référence</Label>
                <Input placeholder="N° de transaction" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={saving} size="sm">{saving ? 'Ajout...' : 'Ajouter'}</Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {transactions.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune transaction enregistrée</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <Card key={tx.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tx.category}</Badge>
                        <span>{new Date(tx.transaction_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()} FC
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Supprimer ?')) onDelete(tx.id); }}>
                      <Trash2 className="h-3 w-3" />
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
