import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type GastronomyType = 'recipe' | 'restaurant_dish' | 'hotel_room' | 'private_room';

interface GastronomySubmissionFormProps {
  onClose: () => void;
}

const GastronomySubmissionForm = ({ onClose }: GastronomySubmissionFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '' as GastronomyType | '',
    title: '',
    description: '',
    price_min: '',
    price_max: '',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    location: '',
    category: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.type && formData.title && formData.description;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormValid()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('gastronomy_items').insert({
        author_id: user.id,
        type: formData.type as GastronomyType,
        title: formData.title,
        description: formData.description,
        price_min: formData.price_min ? parseFloat(formData.price_min) : null,
        price_max: formData.price_max ? parseFloat(formData.price_max) : null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        contact_whatsapp: formData.contact_whatsapp || null,
        location: formData.location || null,
        category: formData.category || null,
        status: 'published'
      });

      if (error) throw error;

      toast.success('Annonce publiée avec succès!');
      onClose();
    } catch (error) {
      console.error('Error submitting gastronomy item:', error);
      toast.error('Erreur lors de la publication de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publier une annonce</CardTitle>
        <CardDescription>
          Partagez une recette, un plat de restaurant, ou une chambre à louer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type d'annonce *</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recipe">Recette</SelectItem>
                <SelectItem value="restaurant_dish">Plat de Restaurant</SelectItem>
                <SelectItem value="hotel_room">Chambre d'Hôtel</SelectItem>
                <SelectItem value="private_room">Chambre Particulier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Langouste grillée, Chambre vue mer..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Décrivez votre annonce en détail..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="Ex: Fruits de mer, Cuisine locale..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_min">Prix minimum (KMF)</Label>
              <Input
                id="price_min"
                type="number"
                value={formData.price_min}
                onChange={(e) => handleChange('price_min', e.target.value)}
                placeholder="Ex: 5000"
              />
            </div>
            <div>
              <Label htmlFor="price_max">Prix maximum (KMF)</Label>
              <Input
                id="price_max"
                type="number"
                value={formData.price_max}
                onChange={(e) => handleChange('price_max', e.target.value)}
                placeholder="Ex: 8000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Localisation</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Ex: Moroni, Mutsamudu..."
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-semibold mb-3">
              Informations de contact (visibles uniquement pour les comptes PRO)
            </p>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="contact_phone">Téléphone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+269 123 45 67"
                />
              </div>

              <div>
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="exemple@email.com"
                />
              </div>

              <div>
                <Label htmlFor="contact_whatsapp">WhatsApp</Label>
                <Input
                  id="contact_whatsapp"
                  type="tel"
                  value={formData.contact_whatsapp}
                  onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
                  placeholder="+269 123 45 67"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={!isFormValid() || loading} className="flex-1">
              {loading ? 'Publication...' : 'Publier'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default GastronomySubmissionForm;
