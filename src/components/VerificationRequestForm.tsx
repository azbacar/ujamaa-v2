import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BadgeCheck, Upload, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function VerificationRequestForm() {
  const { user } = useAuth();
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState('freelancer');
  const [businessName, setBusinessName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setExisting(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !documentType || !file) {
      toast.error('Veuillez remplir tous les champs obligatoires et joindre un document');
      return;
    }
    setSubmitting(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from('verification_requests').insert({
        user_id: user.id,
        type,
        business_name: businessName || null,
        document_type: documentType,
        document_url: path,
        additional_info: additionalInfo || null,
      });
      if (error) throw error;

      toast.success('Demande de vérification soumise avec succès !');
      // Refresh
      const { data } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setExisting(data);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-4 text-muted-foreground text-sm">Chargement...</div>;

  if (existing) {
    const statusConfig = {
      pending: { icon: Clock, label: 'En attente de vérification', color: 'bg-amber-100 text-amber-700', variant: 'secondary' as const },
      approved: { icon: CheckCircle, label: 'Vérifié ✓', color: 'bg-green-100 text-green-700', variant: 'default' as const },
      rejected: { icon: XCircle, label: 'Rejeté', color: 'bg-red-100 text-red-700', variant: 'destructive' as const },
    };
    const cfg = statusConfig[existing.status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = cfg.icon;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BadgeCheck className="h-5 w-5" /> Vérification de profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`flex items-center gap-2 p-3 rounded-lg ${cfg.color}`}>
            <Icon className="h-5 w-5" />
            <span className="font-medium text-sm">{cfg.label}</span>
          </div>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>Type : <span className="text-foreground capitalize">{existing.type}</span></p>
            {existing.business_name && <p>Nom : <span className="text-foreground">{existing.business_name}</span></p>}
            <p>Document : <span className="text-foreground">{existing.document_type}</span></p>
            <p>Soumis le : {new Date(existing.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
          {existing.status === 'rejected' && existing.review_notes && (
            <div className="p-3 rounded-lg bg-destructive/10 text-sm">
              <p className="font-medium text-destructive">Motif du rejet :</p>
              <p className="text-muted-foreground mt-1">{existing.review_notes}</p>
            </div>
          )}
          {existing.status === 'rejected' && (
            <Button variant="outline" size="sm" onClick={() => setExisting(null)}>
              Soumettre une nouvelle demande
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BadgeCheck className="h-5 w-5" /> Demande de vérification
        </CardTitle>
        <CardDescription>Soumettez vos documents pour obtenir le badge vérifié</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type de profil *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="announcer">Annonceur</SelectItem>
                <SelectItem value="project_carrier">Porteur de projet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nom professionnel / Entreprise</Label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Nom ou raison sociale" className="mt-1" />
          </div>
          <div>
            <Label>Type de document *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cin">Carte d'identité nationale (CIN)</SelectItem>
                <SelectItem value="passport">Passeport</SelectItem>
                <SelectItem value="rccm">Registre de commerce (RCCM)</SelectItem>
                <SelectItem value="nif">Numéro d'identification fiscale (NIF)</SelectItem>
                <SelectItem value="other">Autre document officiel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Document justificatif *</Label>
            <div className="mt-1">
              <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : 'Cliquez pour sélectionner un fichier (PDF, JPG, PNG)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
          <div>
            <Label>Informations complémentaires</Label>
            <Textarea
              value={additionalInfo}
              onChange={e => setAdditionalInfo(e.target.value)}
              placeholder="Informations supplémentaires pour faciliter la vérification..."
              className="mt-1"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !documentType || !file}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi en cours...</> : 'Soumettre la demande'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
