
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, DollarSign, MapPin, User, Package, ImagePlus, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';

interface PriceDefaults {
  vendorName?: string;
  market?: string;
  village?: string;
  city?: string;
  island?: string;
  latitude?: string;
  longitude?: string;
  merchantType?: 'fixed' | 'ambulant';
  category?: string;
  unit?: string;
  currency?: string;
  productName?: string;
  price?: string;
}

interface PriceSubmissionFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaults?: PriceDefaults;
}

const PriceSubmissionForm = ({ onClose, onSuccess, defaults }: PriceSubmissionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAnnonceur } = useRole();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [formData, setFormData] = useState({
    productName: defaults?.productName || '',
    category: defaults?.category || '',
    unit: defaults?.unit || '',
    price: defaults?.price || '',
    currency: defaults?.currency || 'FC',
    vendorName: defaults?.vendorName || '',
    village: defaults?.village || '',
    city: defaults?.city || '',
    island: defaults?.island || '',
    market: defaults?.market || '',
    latitude: defaults?.latitude || '',
    longitude: defaults?.longitude || '',
    merchantType: (defaults?.merchantType || 'fixed') as 'fixed' | 'ambulant',
    geoExpiresHours: '24',
  });

  const hasPrefilled = !!(defaults?.vendorName || defaults?.market || defaults?.city);

  const categories = [
    'Céréales', 'Fruits', 'Légumes', 'Poissons', 'Viandes', 'Huiles', 
    'Épices', 'Produits laitiers', 'Tubercules', 'Matériaux', 
    'Produits ménagers', 'Carburants', 'Produits agricoles', 'Produits alimentaires'
  ];

  const islands = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];
  const units = ['kg', 'litre', 'pièce', 'régime', 'boîte', 'sac', 'paquet', 'gramme'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image trop volumineuse', description: 'Maximum 5 Mo.', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Géolocalisation non disponible', variant: 'destructive' });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGeoLoading(false);
        toast({ title: '📍 Position détectée' });
      },
      () => {
        setGeoLoading(false);
        toast({ title: 'Impossible de détecter la position', variant: 'destructive' });
      }
    );
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const ext = imageFile.name.split('.').pop();
    // Path must start with auth.uid() folder per event-images RLS
    const path = `${user.id}/prices/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('event-images').upload(path, imageFile, { contentType: imageFile.type });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Connexion requise", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrl = await uploadImage();

      const insertData: any = {
        product: formData.productName,
        category: formData.category,
        price: parseFloat(formData.price),
        currency: formData.currency,
        unit: formData.unit,
        vendor: formData.vendorName,
        market: formData.market || 'Non spécifié',
        village: formData.village,
        city: formData.city,
        island: formData.island,
        region: null,
        author_id: user.id,
        status: 'published',
        trend: 'stable',
        image_url: imageUrl,
      };

      // Geolocation only for pro announcers
      if (isAnnonceur() && formData.latitude && formData.longitude) {
        insertData.latitude = parseFloat(formData.latitude);
        insertData.longitude = parseFloat(formData.longitude);
        insertData.merchant_type = formData.merchantType;
        if (formData.merchantType === 'ambulant') {
          const hours = parseInt(formData.geoExpiresHours);
          insertData.geo_expires_at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        }
      }

      const { error } = await supabase.from('prices').insert(insertData);
      if (error) throw error;

      toast({
        title: "✅ Prix ajouté avec succès!",
        description: `${formData.productName} a été ajouté aux prix de ${formData.market || formData.city}.`,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error submitting price:', error);
      toast({ title: "Erreur", description: error.message || "Impossible d'ajouter le prix.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.productName && formData.category && formData.price && 
           formData.vendorName && formData.city && 
           formData.island && formData.unit && formData.market;
  };

  const isProAnnonceur = isAnnonceur();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white relative">
          <Button variant="ghost" size="sm" onClick={onClose} className="absolute right-4 top-4 text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="flex items-center gap-3">
            <Plus className="w-6 h-6" />
            Ajouter un prix
          </CardTitle>
          <p className="text-white/90 text-sm">Partagez vos prix avec la communauté UJAMAA</p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Produit */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-emerald-700">
                <Package className="w-5 h-5" />
                Informations du produit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName">Nom du produit *</Label>
                  <Input id="productName" value={formData.productName} onChange={(e) => handleInputChange('productName', e.target.value)} placeholder="Ex: Riz blanc importé" className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(v) => handleInputChange('category', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unit">Unité de mesure *</Label>
                  <Select value={formData.unit} onValueChange={(v) => handleInputChange('unit', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                    <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price" className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Prix (FC) *</Label>
                  <Input id="price" type="number" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} placeholder="1500" className="mt-1" required />
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-emerald-700">
                <ImagePlus className="w-5 h-5" />
                Photo du produit
              </h3>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer border-2 border-dashed border-emerald-200 rounded-xl p-4 text-center hover:border-emerald-400 transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Aperçu" className="h-32 mx-auto rounded-lg object-cover" />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      <ImagePlus className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      Cliquez pour ajouter une photo (max 5 Mo)
                    </div>
                  )}
                </label>
                {imagePreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Vendeur */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-emerald-700">
                <User className="w-5 h-5" />
                Informations vendeur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorName">Nom du vendeur *</Label>
                  <Input id="vendorName" value={formData.vendorName} onChange={(e) => handleInputChange('vendorName', e.target.value)} placeholder="Mama Hadija, Ahmed..." className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="market">Marché/Lieu de vente *</Label>
                  <Input id="market" value={formData.market} onChange={(e) => handleInputChange('market', e.target.value)} placeholder="Marché Central..." className="mt-1" required />
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-emerald-700">
                <MapPin className="w-5 h-5" />
                Localisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="island">Île *</Label>
                  <Select value={formData.island} onValueChange={(v) => handleInputChange('island', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                    <SelectContent>{islands.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Input id="city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} placeholder="Moroni, Mutsamudu..." className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="village">Village/Quartier</Label>
                  <Input id="village" value={formData.village} onChange={(e) => handleInputChange('village', e.target.value)} placeholder="Volo-Volo, Bangoi..." className="mt-1" />
                </div>
              </div>

              {/* Geolocation for pro announcers */}
              {isProAnnonceur && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      📍 Géolocalisation Pro
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={handleGeolocate} disabled={geoLoading} className="border-amber-300 text-amber-700 hover:bg-amber-100">
                      {geoLoading ? 'Détection...' : '📍 Détecter ma position'}
                    </Button>
                  </div>

                  {/* Merchant type */}
                  <div>
                    <Label className="text-sm font-medium text-amber-800">Type de marchand</Label>
                    <Select value={formData.merchantType} onValueChange={(v) => handleInputChange('merchantType', v)}>
                      <SelectTrigger className="mt-1 border-amber-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">🏪 Point de vente fixe (boutique, marché)</SelectItem>
                        <SelectItem value="ambulant">🚶 Marchand ambulant</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-amber-600 mt-1">
                      {formData.merchantType === 'fixed' 
                        ? "La position reste visible indéfiniment" 
                        : "La position expirera automatiquement"}
                    </p>
                  </div>

                  {/* Duration for ambulant */}
                  {formData.merchantType === 'ambulant' && (
                    <div>
                      <Label className="text-sm font-medium text-amber-800">Durée de validité de la position</Label>
                      <Select value={formData.geoExpiresHours} onValueChange={(v) => handleInputChange('geoExpiresHours', v)}>
                        <SelectTrigger className="mt-1 border-amber-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 heures</SelectItem>
                          <SelectItem value="12">12 heures</SelectItem>
                          <SelectItem value="24">24 heures</SelectItem>
                          <SelectItem value="48">48 heures (2 jours)</SelectItem>
                          <SelectItem value="72">72 heures (3 jours)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Latitude</Label>
                      <Input value={formData.latitude} onChange={(e) => handleInputChange('latitude', e.target.value)} placeholder="-12.2345" className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Longitude</Label>
                      <Input value={formData.longitude} onChange={(e) => handleInputChange('longitude', e.target.value)} placeholder="44.2678" className="mt-1 text-sm" />
                    </div>
                  </div>

                  {/* Map preview */}
                  {formData.latitude && formData.longitude && (
                    <div className="rounded-lg overflow-hidden border border-amber-200">
                      <iframe
                        title="Aperçu position"
                        width="100%"
                        height="150"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.longitude) - 0.005},${parseFloat(formData.latitude) - 0.005},${parseFloat(formData.longitude) + 0.005},${parseFloat(formData.latitude) + 0.005}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                ℹ️ <strong>Information :</strong> Votre prix sera visible immédiatement. Les informations frauduleuses entraîneront la suspension du compte.
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">Annuler</Button>
              <Button type="submit" disabled={!isFormValid() || isSubmitting} className="flex-1 bg-gradient-to-r from-emerald-500 to-ocean-500">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Envoi...
                  </div>
                ) : '✨ Publier le prix'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceSubmissionForm;
