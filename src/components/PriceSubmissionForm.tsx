
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, DollarSign, MapPin, User, Package, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PriceSubmissionFormProps {
  onClose: () => void;
}

const PriceSubmissionForm = ({ onClose }: PriceSubmissionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    unit: '',
    description: '',
    price: '',
    currency: 'FC',
    vendorName: '',
    shopName: '',
    village: '',
    city: '',
    island: '',
    market: '',
    phone: '',
    email: '',
    hasImage: false
  });

  const categories = [
    'Céréales', 'Fruits', 'Légumes', 'Poissons', 'Viandes', 'Huiles', 
    'Épices', 'Produits laitiers', 'Tubercules', 'Matériaux', 
    'Produits ménagers', 'Carburants', 'Produits agricoles', 'Produits alimentaires'
  ];

  const islands = ['Grande Comore', 'Anjouan', 'Mohéli', 'Mayotte'];
  const units = ['kg', 'litre', 'pièce', 'régime', 'boîte', 'sac', 'paquet', 'gramme'];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour soumettre un prix.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('prices').insert({
        product: formData.productName,
        category: formData.category,
        price: parseFloat(formData.price),
        currency: formData.currency,
        unit: formData.unit,
        vendor: formData.vendorName,
        market: formData.market || formData.shopName || 'Non spécifié',
        village: formData.village,
        city: formData.city,
        island: formData.island,
        region: null,
        author_id: user.id,
        status: 'published',
        trend: 'stable'
      });

      if (error) throw error;

      toast({
        title: "✅ Prix ajouté avec succès!",
        description: `${formData.productName} a été ajouté aux prix de ${formData.market || formData.city}.`,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error submitting price:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le prix. Réessayez.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.productName && formData.category && formData.price && 
           formData.vendorName && formData.city && 
           formData.island && formData.unit && formData.market;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="flex items-center gap-3">
            <Plus className="w-6 h-6" />
            Ajouter un prix
          </CardTitle>
          <p className="text-white/90 text-sm">
            Partagez vos prix avec la communauté UJAMAA
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations produit */}
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
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unit">Unité de mesure *</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
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

            {/* Informations vendeur */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-emerald-700">
                <User className="w-5 h-5" />
                Informations vendeur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorName">Nom du vendeur *</Label>
                  <Input id="vendorName" value={formData.vendorName} onChange={(e) => handleInputChange('vendorName', e.target.value)} placeholder="Mama Hadija, Ahmed Soilihi..." className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="market">Marché/Lieu de vente *</Label>
                  <Input id="market" value={formData.market} onChange={(e) => handleInputChange('market', e.target.value)} placeholder="Marché Central, Port de pêche..." className="mt-1" required />
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
                  <Select value={formData.island} onValueChange={(value) => handleInputChange('island', value)}>
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
