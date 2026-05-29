import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCreateInvestment } from '@/hooks/useInvest';
import type { InvestProject } from '@/hooks/useInvest';
import PayPalButton from '@/components/PayPalButton';
import { useQueryClient } from '@tanstack/react-query';


interface Props {
  project: InvestProject;
  onSuccess?: () => void;
}

export default function InvestmentForm({ project, onSuccess }: Props) {
  const { user } = useAuth();
  const createInvestment = useCreateInvestment();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    amount: '',
    payment_method: 'mobile_money',
    payment_reference: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    createInvestment.mutate({
      project_id: project.id,
      investor_id: user.id,
      amount: Number(form.amount),
      currency: project.currency,
      status: 'pending',
      payment_method: form.payment_method,
      payment_reference: form.payment_reference || null,
      message: form.message || null,
    }, {
      onSuccess: () => {
        setForm({ amount: '', payment_method: 'mobile_money', payment_reference: '', message: '' });
        onSuccess?.();
      },
    });
  };

  const minInvestment = project.min_investment || 0;
  const isPaypal = form.payment_method === 'paypal';
  const numericAmount = Number(form.amount) || 0;
  // PayPalButton expects KMF; for projects in other currencies, we still pass through
  // and trust the displayed converted amount.
  const amountKMFEquivalent = (() => {
    const c = (project.currency || 'KMF').toUpperCase();
    if (c === 'KMF' || c === 'FC') return numericAmount;
    if (c === 'EUR') return Math.round(numericAmount * 492);
    if (c === 'USD') return Math.round(numericAmount * 455);
    return numericAmount;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">💰 Investir dans ce projet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Montant ({project.currency}) *</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
              required
              min={minInvestment}
              placeholder={`Min: ${new Intl.NumberFormat('fr-FR').format(minInvestment)}`}
            />
            {minInvestment > 0 && (
              <p className="text-xs text-muted-foreground">
                Investissement minimum : {new Intl.NumberFormat('fr-FR').format(minInvestment)} {project.currency}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Méthode de paiement</Label>
            <Select value={form.payment_method} onValueChange={v => setForm(prev => ({ ...prev, payment_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="paypal">PayPal (carte / compte PayPal)</SelectItem>
                <SelectItem value="virement">Virement bancaire</SelectItem>
                <SelectItem value="western_union">Western Union</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isPaypal && (
            <div className="space-y-2">
              <Label>Référence de paiement</Label>
              <Input
                value={form.payment_reference}
                onChange={e => setForm(prev => ({ ...prev, payment_reference: e.target.value }))}
                placeholder="Numéro de transaction..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Message (optionnel)</Label>
            <Textarea
              value={form.message}
              onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              placeholder="Un mot pour le porteur du projet..."
            />
          </div>

          {isPaypal ? (
            numericAmount >= Math.max(1, minInvestment) ? (
              <PayPalButton
                amountKMF={amountKMFEquivalent}
                description={`Investissement : ${project.title || 'projet'}`}
                purpose="investment"
                metadata={{
                  project_id: project.id,
                  message: form.message || null,
                }}
                onSuccess={() => {
                  setForm({ amount: '', payment_method: 'mobile_money', payment_reference: '', message: '' });
                  queryClient.invalidateQueries({ queryKey: ['invest'] });
                  queryClient.invalidateQueries({ queryKey: ['project-investments'] });
                  onSuccess?.();
                }}
              />
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                Saisissez un montant pour afficher le bouton PayPal.
              </p>
            )
          ) : (
            <Button type="submit" disabled={createInvestment.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
              {createInvestment.isPending ? 'Envoi...' : 'Confirmer l\'investissement'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

