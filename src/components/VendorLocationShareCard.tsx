import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Radio, Square, Crown, Lock, Store, Truck } from 'lucide-react';
import { useVendorLocation } from '@/hooks/useVendorLocation';
import { useProStatus } from '@/hooks/useProStatus';
import { Link } from 'react-router-dom';
import { authPath, proPath } from '@/lib/authRedirect';

const ISLANDS = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];
const CATEGORIES = ['Fruits & légumes', 'Poissons', 'Viandes', 'Restauration', 'Boulangerie', 'Vêtements', 'Boissons', 'Autre'];

interface Props {
  /** Deprecated — kept for retro-compat. La logique réelle vient de useProStatus. */
  isProAnnonceur?: boolean;
}

export default function VendorLocationShareCard(_props: Props) {
  const { isPro, isVerified, canShareLocation, loading } = useProStatus();
  const { isActive, isSharing, expiresAt, isMobileActive, startSharing, stopSharing } = useVendorLocation();
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('');
  const [island, setIsland] = useState('');
  const [duration, setDuration] = useState<number[]>([60]);
  const [mode, setMode] = useState<'ambulant' | 'fixe'>('ambulant');
  const [address, setAddress] = useState('');
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = expiresAt.getTime() - Date.now();
      if (ms <= 0) { setRemaining('Expiré'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setRemaining(h > 0 ? `${h}h ${m}min` : `${m}min`);
    };
    tick();
    const i = setInterval(tick, 30000);
    return () => clearInterval(i);
  }, [expiresAt]);

  if (loading) {
    return <Card><CardContent className="py-6 text-sm text-muted-foreground">Chargement…</CardContent></Card>;
  }

  // Eligibility: Pro OR Verified (with active role announcer/freelancer/enterprise)
  if (!canShareLocation) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Crown className="h-5 w-5" /> Géolocalisation publique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Partagez votre position sur la carte publique pour que vos clients vous trouvent.
            Réservé aux comptes <strong>Pro</strong> ou <strong>Vérifiés</strong> (annonceur, freelancer, entreprise).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-amber-600 hover:bg-amber-700">
              <Link to={proPath()}><Lock className="h-4 w-4 mr-2" /> Devenir Pro</Link>
            </Button>
            {!isVerified && (
              <Button asChild variant="outline">
                <Link to="/profile?tab=verification">Demander la vérification (gratuit)</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
  };

  return (
    <Card className={isActive ? 'border-emerald-300 bg-emerald-50/40' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-600" />
          Partage de position
          {isActive && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {isMobileActive ? 'AMBULANT' : 'FIXE'} — {remaining}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isActive ? (
          <>
            <div>
              <Label className="mb-2 block">Type de présence</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'ambulant' | 'fixe')} className="grid grid-cols-2 gap-2">
                <label className={`flex items-start gap-2 p-3 border rounded-md cursor-pointer ${mode === 'ambulant' ? 'border-emerald-500 bg-emerald-50' : 'border-border'}`}>
                  <RadioGroupItem value="ambulant" id="m-amb" className="mt-1" />
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1"><Truck className="h-4 w-4" /> Ambulant</div>
                    <div className="text-xs text-muted-foreground">Suivi en direct (GPS qui bouge)</div>
                  </div>
                </label>
                <label className={`flex items-start gap-2 p-3 border rounded-md cursor-pointer ${mode === 'fixe' ? 'border-emerald-500 bg-emerald-50' : 'border-border'}`}>
                  <RadioGroupItem value="fixe" id="m-fix" className="mt-1" />
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1"><Store className="h-4 w-4" /> Fixe</div>
                    <div className="text-xs text-muted-foreground">Boutique / point de vente</div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="vl-label">Nom affiché *</Label>
              <Input
                id="vl-label"
                placeholder="Ex: Vendeur de poisson Mohamed"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={80}
              />
            </div>

            {mode === 'fixe' && (
              <div>
                <Label htmlFor="vl-addr">Adresse / repère</Label>
                <Input
                  id="vl-addr"
                  placeholder="Ex: Marché Volo-Volo, stand 12"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={120}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Type de produit" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Île</Label>
                <Select value={island} onValueChange={setIsland}>
                  <SelectTrigger><SelectValue placeholder="Île" /></SelectTrigger>
                  <SelectContent>
                    {ISLANDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Durée d'affichage : <strong>{formatDuration(duration[0])}</strong></Label>
              <Slider
                min={15} max={720} step={15}
                value={duration}
                onValueChange={setDuration}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">15 minutes à 12 heures</p>
            </div>

            <Button
              onClick={() => startSharing({
                label: label.trim(),
                category,
                island,
                durationMinutes: duration[0],
                isMobile: mode === 'ambulant',
                address: mode === 'fixe' ? address.trim() : undefined,
              })}
              disabled={isSharing || label.trim().length < 3}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Radio className="h-4 w-4 mr-2" />
              {isSharing ? 'Activation...' : (mode === 'ambulant' ? 'Démarrer le suivi en direct' : 'Enregistrer ma position')}
            </Button>
            <p className="text-xs text-muted-foreground">
              {mode === 'ambulant'
                ? '⚠️ Gardez cet onglet ouvert pour la mise à jour en temps réel.'
                : 'ℹ️ Position enregistrée une fois, visible sur la carte jusqu\'à expiration.'}
              {!isPro && isVerified && ' Géolocalisation accessible gratuitement grâce à votre statut Vérifié.'}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm">
              ✅ Votre position {isMobileActive ? 'est diffusée en direct' : 'est affichée'}. Voir sur{' '}
              <Link to="/carte-vendeurs" className="text-emerald-700 underline font-medium">la carte publique</Link>.
            </p>
            <Button onClick={stopSharing} variant="destructive" className="w-full">
              <Square className="h-4 w-4 mr-2" /> Arrêter le partage
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
