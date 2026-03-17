import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCreateDiasporaProject } from '@/hooks/useDiaspora';

const categories = [
  { value: 'agriculture', label: '🌾 Agriculture' },
  { value: 'immobilier', label: '🏠 Immobilier' },
  { value: 'commerce', label: '🏪 Commerce' },
  { value: 'technologie', label: '💻 Technologie' },
  { value: 'education', label: '📚 Éducation' },
  { value: 'sante', label: '🏥 Santé' },
  { value: 'energie', label: '⚡ Énergie' },
  { value: 'tourisme', label: '🏖️ Tourisme' },
  { value: 'artisanat', label: '🎨 Artisanat' },
  { value: 'autre', label: '📦 Autre' },
];

const islands = [
  'Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte',
];

interface Props {
  onSuccess?: () => void;
}

export default function DiasporaProjectForm({ onSuccess }: Props) {
  const { user } = useAuth();
  const createProject = useCreateDiasporaProject();

  const [form, setForm] = useState({
    title: '',
    description: '',
    full_content: '',
    category: 'agriculture',
    target_amount: '',
    currency: 'FC',
    island: '',
    location: '',
    min_investment: '',
    contact_email: '',
    contact_phone: '',
    deadline: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    createProject.mutate({
      title: form.title,
      description: form.description,
      full_content: form.full_content || null,
      category: form.category,
      target_amount: Number(form.target_amount) || 0,
      currency: form.currency,
      author_id: user.id,
      island: form.island || null,
      location: form.location || null,
      status: 'draft',
      images: null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      min_investment: Number(form.min_investment) || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
    }, {
      onSuccess: () => {
        setForm({
          title: '', description: '', full_content: '', category: 'agriculture',
          target_amount: '', currency: 'FC', island: '', location: '',
          min_investment: '', contact_email: '', contact_phone: '', deadline: '',
        });
        onSuccess?.();
      },
    });
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📋 Soumettre un projet d'investissement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Titre du projet *</Label>
              <Input value={form.title} onChange={e => update('title', e.target.value)} required placeholder="Ex: Ferme avicole à Moroni" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description courte *</Label>
              <Textarea value={form.description} onChange={e => update('description', e.target.value)} required rows={3} placeholder="Résumé du projet..." />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description complète</Label>
              <Textarea value={form.full_content} onChange={e => update('full_content', e.target.value)} rows={6} placeholder="Détails, objectifs, plan de financement..." />
            </div>

            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Île</Label>
              <Select value={form.island} onValueChange={v => update('island', v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {islands.map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Montant cible ({form.currency}) *</Label>
              <Input type="number" value={form.target_amount} onChange={e => update('target_amount', e.target.value)} required min={0} placeholder="500000" />
            </div>

            <div className="space-y-2">
              <Label>Investissement minimum ({form.currency})</Label>
              <Input type="number" value={form.min_investment} onChange={e => update('min_investment', e.target.value)} min={0} placeholder="10000" />
            </div>

            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={form.currency} onValueChange={v => update('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FC">FC (Franc Comorien)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date limite</Label>
              <Input type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Localité</Label>
              <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Moroni, Mutsamudu..." />
            </div>

            <div className="space-y-2">
              <Label>Email de contact</Label>
              <Input type="email" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} placeholder="contact@example.com" />
            </div>

            <div className="space-y-2">
              <Label>Téléphone de contact</Label>
              <Input value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} placeholder="+269 3XX XX XX" />
            </div>
          </div>

          <Button type="submit" disabled={createProject.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
            {createProject.isPending ? 'Envoi en cours...' : 'Soumettre le projet (brouillon)'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
