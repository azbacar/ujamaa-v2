import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileUp, Building, User, Phone, Mail, MapPin, DollarSign, Calendar, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TenderSubmissionFormProps {
  tenderId: number;
  tenderTitle: string;
  onClose: () => void;
}

const TenderSubmissionForm = ({ tenderId, tenderTitle, onClose }: TenderSubmissionFormProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Informations entreprise
    companyName: '',
    companyType: '',
    registrationNumber: '',
    taxNumber: '',
    address: '',
    city: '',
    island: '',
    
    // Contact principal
    contactName: '',
    contactTitle: '',
    phone: '',
    email: '',
    
    // Proposition technique
    proposedAmount: '',
    deliveryTime: '',
    technicalApproach: '',
    teamDescription: '',
    
    // Documents
    hasBusinessLicense: false,
    hasInsurance: false,
    hasReferences: false,
    hasTechnicalSpecs: false,
    
    // Conditions
    acceptsTerms: false,
    acceptsDeadline: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "✅ Offre soumise avec succès!",
      description: `Votre proposition pour "${tenderTitle}" a été envoyée. Vous recevrez une confirmation par email.`,
    });
    
    setIsSubmitting(false);
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">📋 Informations de l'entreprise</h3>
        <p className="text-gray-600">Veuillez renseigner les données de votre entreprise</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Nom de l'entreprise *
          </Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            placeholder="Votre entreprise"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="companyType">Type d'entreprise *</Label>
          <Select value={formData.companyType} onValueChange={(value) => handleInputChange('companyType', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionnez..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sarl">SARL</SelectItem>
              <SelectItem value="sa">SA</SelectItem>
              <SelectItem value="auto-entrepreneur">Auto-entrepreneur</SelectItem>
              <SelectItem value="cooperative">Coopérative</SelectItem>
              <SelectItem value="association">Association</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="registrationNumber">N° d'immatriculation *</Label>
          <Input
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
            placeholder="123456789"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="taxNumber">N° fiscal</Label>
          <Input
            id="taxNumber"
            value={formData.taxNumber}
            onChange={(e) => handleInputChange('taxNumber', e.target.value)}
            placeholder="NIF123456"
            className="mt-1"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Adresse complète *
        </Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Adresse, ville, île..."
          className="mt-1"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Ville *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Moroni, Mutsamudu..."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="island">Île *</Label>
          <Select value={formData.island} onValueChange={(value) => handleInputChange('island', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionnez..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grande-comore">Grande Comore</SelectItem>
              <SelectItem value="anjouan">Anjouan</SelectItem>
              <SelectItem value="moheli">Mohéli</SelectItem>
              <SelectItem value="mayotte">Mayotte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">👤 Contact principal</h3>
        <p className="text-gray-600">Personne responsable de ce dossier</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Nom complet *
          </Label>
          <Input
            id="contactName"
            value={formData.contactName}
            onChange={(e) => handleInputChange('contactName', e.target.value)}
            placeholder="Prénom Nom"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="contactTitle">Fonction *</Label>
          <Input
            id="contactTitle"
            value={formData.contactTitle}
            onChange={(e) => handleInputChange('contactTitle', e.target.value)}
            placeholder="Directeur, Chef de projet..."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Téléphone *
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+269 XXX XX XX"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="contact@entreprise.com"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">💼 Proposition technique</h3>
        <p className="text-gray-600">Détails de votre offre</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="proposedAmount" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Montant proposé (KMF) *
          </Label>
          <Input
            id="proposedAmount"
            value={formData.proposedAmount}
            onChange={(e) => handleInputChange('proposedAmount', e.target.value)}
            placeholder="1,500,000"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="deliveryTime" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Délai de livraison *
          </Label>
          <Input
            id="deliveryTime"
            value={formData.deliveryTime}
            onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
            placeholder="60 jours, 3 mois..."
            className="mt-1"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="technicalApproach">Approche technique *</Label>
        <Textarea
          id="technicalApproach"
          value={formData.technicalApproach}
          onChange={(e) => handleInputChange('technicalApproach', e.target.value)}
          placeholder="Décrivez votre méthodologie, les étapes clés, les technologies utilisées..."
          className="mt-1"
          rows={4}
        />
      </div>
      
      <div>
        <Label htmlFor="teamDescription">Équipe projet</Label>
        <Textarea
          id="teamDescription"
          value={formData.teamDescription}
          onChange={(e) => handleInputChange('teamDescription', e.target.value)}
          placeholder="Composition de l'équipe, qualifications, expériences..."
          className="mt-1"
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">📄 Documents requis</h3>
        <p className="text-gray-600">Confirmez que vous disposez des documents nécessaires</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="businessLicense"
            checked={formData.hasBusinessLicense}
            onCheckedChange={(checked) => handleInputChange('hasBusinessLicense', checked)}
          />
          <div className="flex-1">
            <Label htmlFor="businessLicense" className="font-medium">Licence commerciale</Label>
            <p className="text-sm text-gray-600">Copie de votre licence d'exploitation</p>
          </div>
          <FileUp className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="flex items-center space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="insurance"
            checked={formData.hasInsurance}
            onCheckedChange={(checked) => handleInputChange('hasInsurance', checked)}
          />
          <div className="flex-1">
            <Label htmlFor="insurance" className="font-medium">Assurance responsabilité civile</Label>
            <p className="text-sm text-gray-600">Attestation d'assurance en cours de validité</p>
          </div>
          <FileUp className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="flex items-center space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="references"
            checked={formData.hasReferences}
            onCheckedChange={(checked) => handleInputChange('hasReferences', checked)}
          />
          <div className="flex-1">
            <Label htmlFor="references" className="font-medium">Références clients</Label>
            <p className="text-sm text-gray-600">Attestations de projets similaires réalisés</p>
          </div>
          <FileUp className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="flex items-center space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="technicalSpecs"
            checked={formData.hasTechnicalSpecs}
            onCheckedChange={(checked) => handleInputChange('hasTechnicalSpecs', checked)}
          />
          <div className="flex-1">
            <Label htmlFor="technicalSpecs" className="font-medium">Spécifications techniques</Label>
            <p className="text-sm text-gray-600">Devis détaillé et planning de réalisation</p>
          </div>
          <FileUp className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="acceptsTerms"
            checked={formData.acceptsTerms}
            onCheckedChange={(checked) => handleInputChange('acceptsTerms', checked)}
          />
          <Label htmlFor="acceptsTerms" className="text-sm">
            J'accepte les conditions générales et le cahier des charges *
          </Label>
        </div>
        
        <div className="flex items-center space-x-3 mt-2">
          <Checkbox
            id="acceptsDeadline"
            checked={formData.acceptsDeadline}
            onCheckedChange={(checked) => handleInputChange('acceptsDeadline', checked)}
          />
          <Label htmlFor="acceptsDeadline" className="text-sm">
            Je m'engage à respecter les délais de livraison *
          </Label>
        </div>
      </div>
    </div>
  );

  const isStepValid = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.companyName && formData.companyType && formData.registrationNumber && 
               formData.address && formData.city && formData.island;
      case 2:
        return formData.contactName && formData.contactTitle && formData.phone && formData.email;
      case 3:
        return formData.proposedAmount && formData.deliveryTime && formData.technicalApproach;
      case 4:
        return formData.hasBusinessLicense && formData.hasInsurance && 
               formData.acceptsTerms && formData.acceptsDeadline;
      default:
        return false;
    }
  };

  const canSubmit = () => {
    return isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white">
        <CardTitle className="text-center">
          <FileText className="w-6 h-6 mx-auto mb-2" />
          Soumission d'offre
        </CardTitle>
        <p className="text-center text-white/90 text-sm">
          {tenderTitle}
        </p>
        
        {/* Progress bar */}
        <div className="flex justify-center space-x-4 mt-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s <= step ? 'bg-white text-emerald-600' : 'bg-white/30 text-white/70'
              }`}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`w-8 h-1 mx-2 ${s < step ? 'bg-white' : 'bg-white/30'}`} />}
            </div>
          ))}
        </div>
        
        <div className="flex justify-center space-x-8 mt-2">
          <Badge variant="outline" className="text-white border-white/30">Étape {step}/4</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => step === 1 ? onClose() : setStep(step - 1)}
            disabled={isSubmitting}
          >
            {step === 1 ? 'Annuler' : 'Précédent'}
          </Button>
          
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid(step)}
              className="bg-gradient-to-r from-emerald-500 to-ocean-500"
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-ocean-500"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Envoi en cours...
                </div>
              ) : (
                'Soumettre l\'offre'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TenderSubmissionForm;