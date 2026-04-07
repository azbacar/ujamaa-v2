import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Pencil, Camera, Loader2 } from 'lucide-react';
import { useMyFreelancerProfile, useUpsertFreelancerProfile } from '@/hooks/useFreelancerDirectory';
import { useAuth } from '@/hooks/useAuth';
import { COMOROS_ISLANDS } from '@/hooks/useFreelance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function FreelancerProfileForm() {
  const { data: existing } = useMyFreelancerProfile();
  const { user } = useAuth();
  const upsert = useUpsertFreelancerProfile();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    avatar_url: '',
    whatsapp: '',
    facebook_url: '',
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
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
        avatar_url: existing.avatar_url || '',
        whatsapp: existing.whatsapp || '',
        facebook_url: existing.facebook_url || '',
        linkedin_url: existing.linkedin_url || '',
        twitter_url: existing.twitter_url || '',
        instagram_url: existing.instagram_url || '',
      });
    }
  }, [existing, open]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image trop lourde (max 2 Mo)'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('freelancer-avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('freelancer-avatars')
        .getPublicUrl(path);

      setForm(f => ({ ...f, avatar_url: `${publicUrl}?t=${Date.now()}` }));
      toast.success('Photo uploadée');
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

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
        avatar_url: form.avatar_url || null,
        whatsapp: form.whatsapp || null,
        facebook_url: form.facebook_url || null,
        linkedin_url: form.linkedin_url || null,
        twitter_url: form.twitter_url || null,
        instagram_url: form.instagram_url || null,
      } as any,
      { onSuccess: () => setOpen(false) }
    );
  };

  const initials = form.display_name ? form.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

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
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-20 w-20 ring-2 ring-border">
                {form.avatar_url ? <AvatarImage src={form.avatar_url} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <span className="text-xs text-muted-foreground">Cliquer pour changer la photo</span>
          </div>

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

          {/* Contact & Social - visible for all, displayed only for Pro */}
          <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground">📱 Contact & Réseaux sociaux <span className="text-primary">(visibles uniquement pour les comptes Pro)</span></p>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+269 3XX XX XX" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" value={form.facebook_url} onChange={e => setForm(f => ({ ...f, facebook_url: e.target.value }))} placeholder="https://facebook.com/..." />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="twitter">X (Twitter)</Label>
                <Input id="twitter" value={form.twitter_url} onChange={e => setForm(f => ({ ...f, twitter_url: e.target.value }))} placeholder="https://x.com/..." />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" value={form.instagram_url} onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))} placeholder="https://instagram.com/..." />
              </div>
            </div>
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
