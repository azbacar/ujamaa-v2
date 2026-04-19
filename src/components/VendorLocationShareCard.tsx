import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Radio, Square, Crown, Lock } from 'lucide-react';
import { useVendorLocation } from '@/hooks/useVendorLocation';
import { Link } from 'react-router-dom';

const ISLANDS = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];
const CATEGORIES = ['Fruits & légumes', 'Poissons', 'Viandes', 'Restauration', 'Boulangerie', 'Vêtements', 'Boissons', 'Autre'];

interface Props {
  /** true si l'utilisateur courant est annonceur Pro */
  isProAnnonceur: boolean;
}

export default function VendorLocationShareCard({ isProAnnonceur }: Props) {
  const { isActive, isSharing, expiresAt, startSharing, stopSharing } = useVendorLocation();
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('');
  const [island, setIsland] = useState('');
  const [duration, setDuration] = useState<number[]>([60]); // minutes
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

  if (!isProAnnonceur) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <Crown className="h-5 w-5" /> Tracking GPS — réservé Pro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Partagez votre position en direct sur la carte publique pour que vos clients vous trouvent
            où que vous soyez. Disponible avec l'abonnement <strong>UJAMAA Pro</strong>.
          </p>
          <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700">
            <Link to="/pro"><Lock className="h-4 w-4 mr-2" /> Devenir Pro</Link>
          </Button>
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
          Partage de position en direct
          {isActive && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              EN DIRECT — {remaining}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isActive ? (
          <>
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
              <Label>Durée du partage : <strong>{formatDuration(duration[0])}</strong></Label>
              <Slider
                min={15} max={720} step={15}
                value={duration}
                onValueChange={setDuration}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">15 minutes à 12 heures</p>
            </div>
            <Button
              onClick={() => startSharing({ label: label.trim(), category, island, durationMinutes: duration[0] })}
              disabled={isSharing || label.trim().length < 3}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Radio className="h-4 w-4 mr-2" />
              {isSharing ? 'Activation...' : 'Démarrer le partage'}
            </Button>
            <p className="text-xs text-muted-foreground">
              ⚠️ Votre position sera visible publiquement sur la carte des vendeurs jusqu'à expiration.
              Gardez cet onglet ouvert pour la mise à jour en temps réel.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm">
              ✅ Votre position est diffusée en direct. Les clients peuvent vous suivre sur{' '}
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
