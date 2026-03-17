import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCreateCarrierProfile } from '@/hooks/useProjectCarrier';
import { UserCheck } from 'lucide-react';

const islands = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];

export default function CarrierProfileForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const createProfile = useCreateCarrierProfile();

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    phone: '',
    email: user?.email || '',
    island: '',
    location: '',
    organization: '',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    createProfile.mutate({
      user_id: user.id,
      display_name: form.display_name,
      bio: form.bio || null,
      phone: form.phone || null,
      email: form.email || null,
      island: form.island || null,
      location: form.location || null,
      organization: form.organization || null,
    }, { onSuccess });
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-amber-600" />
          Créer votre profil Porteur de Projet
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pour soumettre un projet d'investissement, vous devez d'abord créer votre profil de porteur de projet.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nom complet / Nom d'affichage *</Label>
              <Input value={form.display_name} onChange={e => update('display_name', e.target.value)} required placeholder="Votre nom ou celui de votre organisation" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Présentation</Label>
              <Textarea value={form.bio} onChange={e => update('bio', e.target.value)} rows={3} placeholder="Décrivez-vous et vos motivations..." />
            </div>

            <div className="space-y-2">
              <Label>Organisation / Entreprise</Label>
              <Input value={form.organization} onChange={e => update('organization', e.target.value)} placeholder="Nom de votre structure (optionnel)" />
            </div>

            <div className="space-y-2">
              <Label>Île</Label>
              <Select value={form.island || 'none'} onValueChange={v => update('island', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non spécifié</SelectItem>
                  {islands.map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="contact@example.com" />
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+269 3XX XX XX" />
            </div>

            <div className="space-y-2">
              <Label>Localité</Label>
              <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Moroni, Mutsamudu..." />
            </div>
          </div>

          <Button type="submit" disabled={createProfile.isPending} className="w-full bg-gradient-to-r from-amber-500 to-orange-500">
            {createProfile.isPending ? 'Création...' : 'Créer mon profil porteur de projet'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
