import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, DollarSign, MapPin, User, Package, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PriceSubmissionFormProps {
  onClose: () => void;
}

const PriceSubmissionForm = ({ onClose }: PriceSubmissionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Produit
    productName: '',
    category: '',
    unit: '',
    description: '',
    
    // Prix et localisation
    price: '',
    currency: 'FC',
    vendorName: '',
    shopName: '',
    
    // Localisation
    village: '',
    city: '',
    island: '',
    market: '',
    
    // Contact
    phone: '',
    email: '',
    
    // Images (simulation)
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
    setIsSubmitting(true);
    
    // Simulation d'envoi à la base de données
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "✅ Prix ajouté avec succès!",
      description: `${formData.productName} a été ajouté aux prix de ${formData.market}. Il sera visible après modération.`,
    });
    
    setIsSubmitting(false);
    onClose();
  };

  const isFormValid = () => {
    return formData.productName && formData.category && formData.price && 
           formData.vendorName && formData.village && formData.city && 
           formData.island && formData.unit;
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
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="Ex: Riz blanc importé, Bananes locales..."
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="unit">Unité de mesure *</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Prix (FC) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="1500"
                    className="mt-1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Qualité, origine, informations supplémentaires..."
                  className="mt-1"
                  rows={2}
                />
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
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) => handleInputChange('vendorName', e.target.value)}
                    placeholder="Mama Hadija, Ahmed Soilihi..."
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="shopName">Nom du magasin/stand</Label>
                  <Input
                    id="shopName"
                    value={formData.shopName}
                    onChange={(e) => handleInputChange('shopName', e.target.value)}
                    placeholder="Épicerie Centrale, Stand 15..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+269 XXX XX XX"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@exemple.com"
                    className="mt-1"
                  />
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
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent>
                      {islands.map(island => (
                        <SelectItem key={island} value={island}>
                          {island}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Moroni, Mutsamudu, Fomboni..."
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="village">Village/Quartier *</Label>
                  <Input
                    id="village"
                    value={formData.village}
                    onChange={(e) => handleInputChange('village', e.target.value)}
                    placeholder="Volo-Volo, Bangoi-Madjou..."
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="market">Marché/Lieu de vente</Label>
                  <Input
                    id="market"
                    value={formData.market}
                    onChange={(e) => handleInputChange('market', e.target.value)}
                    placeholder="Marché Central, Port de pêche..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Photo du produit */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-emerald-700">
                <Camera className="w-5 h-5" />
                Photo du produit (optionnel)
              </h3>
              
              <div className="border-2 border-dashed border-emerald-300 rounded-lg p-6 text-center bg-emerald-50/50">
                <Camera className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Ajoutez une photo pour attirer plus d'acheteurs
                </p>
                <Button type="button" variant="outline" className="border-emerald-300 text-emerald-700">
                  Choisir une photo
                </Button>
              </div>
            </div>

            {/* Informations légales */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                ℹ️ <strong>Information :</strong> Votre prix sera vérifié par notre équipe avant publication. 
                Les fausses informations peuvent entraîner la suspension du compte.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Annuler
              </Button>
              
              <Button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-ocean-500"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Envoi...
                  </div>
                ) : (
                  '✨ Publier le prix'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceSubmissionForm;