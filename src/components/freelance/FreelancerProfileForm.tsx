import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Pencil } from 'lucide-react';
import { useMyFreelancerProfile, useUpsertFreelancerProfile, FreelancerProfile } from '@/hooks/useFreelancerDirectory';
import { COMOROS_ISLANDS } from '@/hooks/useFreelance';

export default function FreelancerProfileForm() {
  const { data: existing } = useMyFreelancerProfile();
  const upsert = useUpsertFreelancerProfile();
  const [open, setOpen] = useState(false);
  const isEdit = !!existing;

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    skills: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    experience_years: '0',
    portfolio_url: '',
    island: '',
    location: '',
    is_available: true,
    is_visible: true,
  });

  useEffect(() => {
    if (existing && open) {
      setForm({
        display_name: existing.display_name,
        bio: existing.bio || '',
        skills: (existing.skills || []).join(', '),
        hourly_rate_min: existing.hourly_rate_min?.toString() || '',
        hourly_rate_max: existing.hourly_rate_max?.toString() || '',
        experience_years: existing.experience_years?.toString() || '0',
        portfolio_url: existing.portfolio_url || '',
        island: existing.island || '',
        location: existing.location || '',
        is_available: existing.is_available,
        is_visible: existing.is_visible,
      });
    }
  }, [existing, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.display_name) return;

    upsert.mutate(
      {
        display_name: form.display_name,
        bio: form.bio,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        hourly_rate_min: form.hourly_rate_min ? Number(form.hourly_rate_min) : null,
        hourly_rate_max: form.hourly_rate_max ? Number(form.hourly_rate_max) : null,
        experience_years: Number(form.experience_years) || 0,
        portfolio_url: form.portfolio_url || null,
        island: form.island || null,
        location: form.location || null,
        is_available: form.is_available,
        is_visible: form.is_visible,
      },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? 'outline' : 'default'} className="gap-2">
          {isEdit ? <><Pencil className="h-4 w-4" /> Modifier mon profil</> : <><UserPlus className="h-4 w-4" /> Devenir freelancer</>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier mon profil freelancer' : 'Créer mon profil freelancer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="display_name">Nom affiché *</Label>
            <Input id="display_name" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Votre nom professionnel" required />
          </div>

          <div>
            <Label htmlFor="bio">Bio / Description</Label>
            <Textarea id="bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Présentez-vous et vos services..." rows={3} />
          </div>

          <div>
            <Label htmlFor="skills">Compétences (séparées par des virgules) *</Label>
            <Input id="skills" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, Design graphique, Comptabilité..." required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rate_min">Tarif min (FC/h)</Label>
              <Input id="rate_min" type="number" value={form.hourly_rate_min} onChange={e => setForm(f => ({ ...f, hourly_rate_min: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="rate_max">Tarif max (FC/h)</Label>
              <Input id="rate_max" type="number" value={form.hourly_rate_max} onChange={e => setForm(f => ({ ...f, hourly_rate_max: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label htmlFor="experience">Années d'expérience</Label>
            <Input id="experience" type="number" min="0" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} />
          </div>

          <div>
            <Label htmlFor="portfolio">Portfolio / Site web</Label>
            <Input id="portfolio" value={form.portfolio_url} onChange={e => setForm(f => ({ ...f, portfolio_url: e.target.value }))} placeholder="https://..." />
          </div>

          <div>
            <Label>Île</Label>
            <Select value={form.island} onValueChange={v => setForm(f => ({ ...f, island: v }))}>
              <SelectTrigger><SelectValue placeholder="Votre île" /></SelectTrigger>
              <SelectContent>
                {COMOROS_ISLANDS.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Ville / Localité</Label>
            <Input id="location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Moroni, Mutsamudu..." />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.is_available} onCheckedChange={v => setForm(f => ({ ...f, is_available: v }))} />
            <Label>Disponible pour des missions</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.is_visible} onCheckedChange={v => setForm(f => ({ ...f, is_visible: v }))} />
            <Label>Profil visible dans le répertoire</Label>
          </div>

          <Button type="submit" className="w-full" disabled={upsert.isPending}>
            {upsert.isPending ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer mon profil')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
