import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useCreateFreelanceJob, FREELANCE_CATEGORIES, COMOROS_ISLANDS } from '@/hooks/useFreelance';

export default function FreelanceJobForm() {
  const [open, setOpen] = useState(false);
  const createJob = useCreateFreelanceJob();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    skills: '',
    budget_min: '',
    budget_max: '',
    island: '',
    location: '',
    is_remote: false,
    deadline: '',
    status: 'published' as string,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category) {
      return;
    }

    createJob.mutate(
      {
        title: form.title,
        description: form.description,
        category: form.category,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        currency: 'FC',
        island: form.island || null,
        location: form.location || null,
        is_remote: form.is_remote,
        deadline: form.deadline || null,
        status: form.status,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ title: '', description: '', category: '', skills: '', budget_min: '', budget_max: '', island: '', location: '', is_remote: false, deadline: '', status: 'published' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Publier une mission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publier une mission freelance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input id="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Développeur React pour site web" required />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez la mission en détail..." rows={4} required />
          </div>

          <div>
            <Label>Catégorie *</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
              <SelectContent>
                {FREELANCE_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
            <Input id="skills" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, TypeScript, Node.js" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="budget_min">Budget min (FC)</Label>
              <Input id="budget_min" type="number" value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="budget_max">Budget max (FC)</Label>
              <Input id="budget_max" type="number" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Île</Label>
            <Select value={form.island} onValueChange={v => setForm(f => ({ ...f, island: v }))}>
              <SelectTrigger><SelectValue placeholder="Toutes les îles" /></SelectTrigger>
              <SelectContent>
                {COMOROS_ISLANDS.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Lieu précis</Label>
            <Input id="location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Moroni, quartier..." />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.is_remote} onCheckedChange={v => setForm(f => ({ ...f, is_remote: v }))} />
            <Label>Travail à distance possible</Label>
          </div>

          <div>
            <Label htmlFor="deadline">Date limite de candidature</Label>
            <Input id="deadline" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>

          <Button type="submit" className="w-full" disabled={createJob.isPending}>
            {createJob.isPending ? 'Publication...' : 'Publier la mission'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
