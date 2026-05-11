import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Building, User, Phone, Mail, MapPin, DollarSign, Calendar, FileText, CheckCircle, FileUp, X, AlertCircle, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { authPath } from '@/lib/authRedirect';

interface TenderSubmissionFormProps {
  tenderId: string;
  tenderTitle: string;
  onClose: () => void;
}

const ISLANDS = [
  { value: 'grande-comore', label: 'Grande Comore' },
  { value: 'anjouan', label: 'Anjouan' },
  { value: 'moheli', label: 'Mohéli' },
  { value: 'mayotte', label: 'Mayotte' },
];

const COMPANY_TYPES = [
  { value: 'sarl', label: 'SARL' },
  { value: 'sa', label: 'SA' },
  { value: 'sas', label: 'SAS' },
  { value: 'auto-entrepreneur', label: 'Auto-entrepreneur' },
  { value: 'cooperative', label: 'Coopérative' },
  { value: 'gie', label: 'GIE' },
  { value: 'association', label: 'Association' },
  { value: 'autre', label: 'Autre' },
];

const TenderSubmissionForm = ({ tenderId, tenderTitle, onClose }: TenderSubmissionFormProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: '', companyType: '', registrationNumber: '', taxNumber: '',
    address: '', city: '', island: '',
    contactName: '', contactTitle: '', phone: '', email: user?.email || '',
    proposedAmount: '', currency: 'KMF', deliveryTime: '',
    technicalApproach: '', teamDescription: '',
    coverLetter: '',
    acceptsTerms: false, acceptsDeadline: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: `${f.name} dépasse 10 Mo`, variant: 'destructive' });
        return false;
      }
      return true;
    });
    if (documents.length + valid.length > 8) {
      toast({ title: 'Maximum 8 documents', variant: 'destructive' });
      return;
    }
    setDocuments(prev => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeDocument = (i: number) => setDocuments(prev => prev.filter((_, idx) => idx !== i));

  const uploadDocuments = async (): Promise<string[]> => {
    if (!user || documents.length === 0) return [];
    const urls: string[] = [];
    for (const file of documents) {
      const ext = file.name.split('.').pop() || 'bin';
      const safe = file.name.replace(/[^\w.-]+/g, '_').slice(0, 60);
      const path = `${user.id}/${tenderId}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from('tender-documents').upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw new Error(`Upload échoué (${file.name}): ${error.message}`);
      const { data } = supabase.storage.from('tender-documents').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!user) { navigate(authPath()); return; }
    setIsSubmitting(true);
    try {
      const docUrls = await uploadDocuments();
      const { error } = await supabase.from('tender_submissions').insert({
        tender_id: tenderId,
        submitter_user_id: user.id,
        company_name: formData.companyName,
        company_type: formData.companyType,
        registration_number: formData.registrationNumber,
        tax_number: formData.taxNumber || null,
        address: formData.address,
        city: formData.city,
        island: formData.island,
        contact_name: formData.contactName,
        contact_title: formData.contactTitle,
        contact_phone: formData.phone,
        contact_email: formData.email,
        proposed_amount: formData.proposedAmount ? parseFloat(formData.proposedAmount.replace(/[^\d.]/g, '')) : null,
        currency: formData.currency,
        delivery_time: formData.deliveryTime,
        technical_approach: formData.technicalApproach,
        team_description: formData.teamDescription || null,
        cover_letter: formData.coverLetter || formData.technicalApproach,
        documents: docUrls,
        acknowledged_terms: formData.acceptsTerms,
        status: 'pending',
      });
      if (error) throw error;

      toast({
        title: '✅ Soumission enregistrée',
        description: `Votre offre pour « ${tenderTitle} » a bien été déposée. L'auteur de l'AO en a été notifié.`,
      });
      onClose();
    } catch (e: any) {
      toast({ title: 'Erreur de soumission', description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login gate
  if (!user) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white">
          <CardTitle className="flex items-center gap-2"><LogIn className="w-5 h-5" /> Connexion requise</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-amber-500" />
          <p>Vous devez être connecté pour soumettre une offre sur cet appel d'offres.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={() => navigate(authPath())}>Se connecter</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isStepValid = (s: number) => {
    switch (s) {
      case 1: return formData.companyName && formData.companyType && formData.registrationNumber && formData.address && formData.city && formData.island;
      case 2: return formData.contactName && formData.contactTitle && formData.phone && formData.email;
      case 3: return formData.proposedAmount && formData.deliveryTime && formData.technicalApproach;
      case 4: return formData.acceptsTerms && formData.acceptsDeadline;
      default: return false;
    }
  };

  const canSubmit = () => isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white">
        <CardTitle className="text-center">
          <FileText className="w-6 h-6 mx-auto mb-2" />
          Soumission d'offre — Conforme OHADA
        </CardTitle>
        <p className="text-center text-white/90 text-sm">{tenderTitle}</p>
        <div className="flex justify-center space-x-2 sm:space-x-4 mt-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${s <= step ? 'bg-white text-emerald-600' : 'bg-white/30 text-white/70'}`}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`w-4 sm:w-8 h-1 mx-1 sm:mx-2 ${s < step ? 'bg-white' : 'bg-white/30'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <Badge variant="outline" className="text-white border-white/30">Étape {step}/4</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">📋 Identification de l'entreprise (OHADA)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label><Building className="w-4 h-4 inline mr-1" /> Raison sociale *</Label>
                <Input value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} placeholder="Votre entreprise" />
              </div>
              <div>
                <Label>Forme juridique *</Label>
                <Select value={formData.companyType} onValueChange={v => handleInputChange('companyType', v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                  <SelectContent>{COMPANY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>N° RCCM *</Label>
                <Input value={formData.registrationNumber} onChange={e => handleInputChange('registrationNumber', e.target.value)} placeholder="KM-MOR-01-2024-B-00123" />
              </div>
              <div>
                <Label>N° NIF (fiscal)</Label>
                <Input value={formData.taxNumber} onChange={e => handleInputChange('taxNumber', e.target.value)} placeholder="NIF..." />
              </div>
            </div>
            <div>
              <Label><MapPin className="w-4 h-4 inline mr-1" /> Adresse complète *</Label>
              <Textarea value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Rue, quartier..." rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Ville *</Label>
                <Input value={formData.city} onChange={e => handleInputChange('city', e.target.value)} placeholder="Moroni, Mutsamudu..." />
              </div>
              <div>
                <Label>Île *</Label>
                <Select value={formData.island} onValueChange={v => handleInputChange('island', v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                  <SelectContent>{ISLANDS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">👤 Contact principal du dossier</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label><User className="w-4 h-4 inline mr-1" /> Nom complet *</Label>
                <Input value={formData.contactName} onChange={e => handleInputChange('contactName', e.target.value)} placeholder="Prénom Nom" />
              </div>
              <div>
                <Label>Fonction *</Label>
                <Input value={formData.contactTitle} onChange={e => handleInputChange('contactTitle', e.target.value)} placeholder="Directeur, Chef de projet..." />
              </div>
              <div>
                <Label><Phone className="w-4 h-4 inline mr-1" /> Téléphone *</Label>
                <Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} placeholder="+269 XXX XX XX" />
              </div>
              <div>
                <Label><Mail className="w-4 h-4 inline mr-1" /> Email *</Label>
                <Input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} placeholder="contact@entreprise.km" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">💼 Proposition technique & financière</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label><DollarSign className="w-4 h-4 inline mr-1" /> Montant proposé *</Label>
                <Input value={formData.proposedAmount} onChange={e => handleInputChange('proposedAmount', e.target.value)} placeholder="1 500 000" />
              </div>
              <div>
                <Label>Devise</Label>
                <Select value={formData.currency} onValueChange={v => handleInputChange('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KMF">KMF (Franc Comorien)</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Label><Calendar className="w-4 h-4 inline mr-1" /> Délai d'exécution *</Label>
                <Input value={formData.deliveryTime} onChange={e => handleInputChange('deliveryTime', e.target.value)} placeholder="60 jours, 3 mois..." />
              </div>
            </div>
            <div>
              <Label>Approche méthodologique *</Label>
              <Textarea value={formData.technicalApproach} onChange={e => handleInputChange('technicalApproach', e.target.value)} rows={4} placeholder="Méthodologie, étapes clés, technologies, garanties..." />
            </div>
            <div>
              <Label>Composition de l'équipe</Label>
              <Textarea value={formData.teamDescription} onChange={e => handleInputChange('teamDescription', e.target.value)} rows={3} placeholder="Profils clés, expériences, qualifications..." />
            </div>
            <div>
              <Label>Lettre de motivation (optionnel)</Label>
              <Textarea value={formData.coverLetter} onChange={e => handleInputChange('coverLetter', e.target.value)} rows={3} placeholder="Quelques mots sur votre intérêt pour ce marché..." />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">📄 Pièces jointes & engagements</h3>
            <p className="text-sm text-muted-foreground">
              Joignez les pièces du dossier (RCCM, NIF, attestations fiscales, attestation CNSS, références, devis détaillé, planning, attestation d'assurance...).
            </p>

            <div className="border-2 border-dashed border-emerald-300 rounded-lg p-6 text-center bg-emerald-50/50">
              <FileUp className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
              <label className="cursor-pointer">
                <span className="text-emerald-700 font-medium hover:underline">Choisir des fichiers</span>
                <span className="text-muted-foreground text-sm"> (PDF, JPG, PNG — max 10 Mo / 8 fichiers)</span>
                <input type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              </label>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded-lg bg-background">
                    <div className="flex items-center gap-2 text-sm truncate">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{d.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">({(d.size / 1024).toFixed(0)} Ko)</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeDocument(i)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-200">
              <div className="flex items-start space-x-3">
                <Checkbox id="acceptsTerms" checked={formData.acceptsTerms} onCheckedChange={(c) => handleInputChange('acceptsTerms', !!c)} />
                <Label htmlFor="acceptsTerms" className="text-sm leading-snug">
                  Je certifie sur l'honneur l'exactitude des informations fournies et accepte le cahier des charges et les conditions générales conformément aux dispositions OHADA. *
                </Label>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox id="acceptsDeadline" checked={formData.acceptsDeadline} onCheckedChange={(c) => handleInputChange('acceptsDeadline', !!c)} />
                <Label htmlFor="acceptsDeadline" className="text-sm leading-snug">
                  Je m'engage à respecter le délai d'exécution proposé et à fournir les pièces complémentaires sur demande. *
                </Label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={() => step === 1 ? onClose() : setStep(step - 1)} disabled={isSubmitting}>
            {step === 1 ? 'Annuler' : 'Précédent'}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!isStepValid(step)} className="bg-gradient-to-r from-emerald-500 to-ocean-500">Suivant</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canSubmit() || isSubmitting} className="bg-gradient-to-r from-emerald-500 to-ocean-500">
              {isSubmitting ? (
                <span className="flex items-center gap-2"><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Envoi...</span>
              ) : 'Soumettre l\'offre'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TenderSubmissionForm;
