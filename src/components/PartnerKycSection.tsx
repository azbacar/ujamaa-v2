import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldCheck, Upload, FileText, Loader2, Trash2, ExternalLink,
  CheckCircle2, Clock, XCircle, AlertTriangle, Send,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerKycDocuments, type PartnerAccount } from '@/hooks/usePartner';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const DOC_TYPES = [
  { id: 'id_card', label: '🪪 Carte d\'identité nationale' },
  { id: 'passport', label: '📘 Passeport' },
  { id: 'business_license', label: '🏢 Patente / Registre de commerce' },
  { id: 'tax_certificate', label: '🧾 Attestation fiscale (NIF)' },
  { id: 'other', label: '📄 Autre justificatif' },
];

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

interface Props {
  account: PartnerAccount;
  onUpdated: () => void;
}

export default function PartnerKycSection({ account, onUpdated }: Props) {
  const { user } = useAuth();
  const { documents, refresh } = usePartnerKycDocuments(account.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>('id_card');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const status = account.kyc_status || 'pending';
  const canEdit = status === 'pending' || status === 'rejected';
  const canSubmit = canEdit && documents.length >= 2;

  const handleFile = async (file: File) => {
    if (!user) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)`); return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Format accepté : JPG, PNG, WEBP, PDF'); return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `partner-kyc/${account.id}/${docType}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('verification-documents')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from('partner_kyc_documents').insert({
        partner_id: account.id,
        document_type: docType,
        file_path: path,
        file_name: file.name,
        notes: notes.trim() || null,
        uploaded_by: user.id,
      });
      if (insErr) {
        await supabase.storage.from('verification-documents').remove([path]);
        throw insErr;
      }
      toast.success('Document ajouté ✅');
      setNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      refresh();
    } catch (e: any) {
      logger.error('partner kyc upload failed', e);
      toast.error(e?.message || 'Erreur lors du téléversement');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, path: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await supabase.storage.from('verification-documents').remove([path]);
      const { error } = await supabase.from('partner_kyc_documents').delete().eq('id', docId);
      if (error) throw error;
      toast.success('Document supprimé');
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    }
  };

  const handleView = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .createSignedUrl(path, 600);
    if (error || !data?.signedUrl) { toast.error('Impossible d\'ouvrir le document'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitKyc = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('partner_accounts')
        .update({ kyc_status: 'submitted' })
        .eq('id', account.id);
      if (error) throw error;
      toast.success('Dossier soumis pour validation ✅');
      onUpdated();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = () => {
    if (status === 'approved') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> KYC approuvé</Badge>;
    if (status === 'submitted') return <Badge className="bg-ocean-100 text-ocean-700 border-ocean-200"><Clock className="h-3 w-3 mr-1" /> En cours d'examen</Badge>;
    if (status === 'rejected') return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejeté</Badge>;
    return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" /> KYC requis</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Vérification d'identité (KYC)
            </CardTitle>
            <CardDescription>
              Téléversez votre pièce d'identité et un justificatif d'activité.
              L'approbation est obligatoire avant tout dépôt à AZZHY.
            </CardDescription>
          </div>
          {renderStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'approved' && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <AlertDescription className="text-sm">
              ✅ Votre dossier a été approuvé{account.kyc_reviewed_at ? ` le ${new Date(account.kyc_reviewed_at).toLocaleDateString('fr-FR')}` : ''}.
              Vous pouvez désormais soumettre des dépôts AZZHY.
            </AlertDescription>
          </Alert>
        )}
        {status === 'submitted' && (
          <Alert className="border-ocean-200 bg-ocean-50">
            <AlertDescription className="text-sm">
              ⏳ Votre dossier est en cours d'examen par notre équipe (sous 48h ouvrées).
              Vous recevrez une notification dès la décision.
            </AlertDescription>
          </Alert>
        )}
        {status === 'rejected' && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              ❌ Votre dossier a été rejeté.
              {account.kyc_rejection_reason && <><br /><strong>Motif :</strong> {account.kyc_rejection_reason}</>}
              <br />Corrigez les documents ci-dessous puis re-soumettez.
            </AlertDescription>
          </Alert>
        )}
        {status === 'pending' && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertDescription className="text-sm">
              ⚠️ Vous devez fournir <strong>au moins 2 documents</strong> (1 pièce d'identité + 1 justificatif d'activité)
              pour activer la collecte des paiements AZZHY.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload form */}
        {canEdit && (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Type de document *</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fichier (JPG/PNG/PDF, max {MAX_SIZE_MB} Mo) *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,application/pdf,image/*"
                  disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white file:cursor-pointer file:hover:bg-emerald-700 mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Note (optionnel)</Label>
              <Textarea
                placeholder="Précisions à l'attention du vérificateur..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            {uploading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Téléversement...
              </div>
            )}
          </div>
        )}

        {/* Documents list */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Documents fournis ({documents.length})</p>
          {documents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucun document pour l'instant</p>
          ) : (
            documents.map(d => {
              const typeLabel = DOC_TYPES.find(t => t.id === d.document_type)?.label || d.document_type;
              return (
                <div key={d.id} className="flex items-center justify-between gap-2 p-2.5 border rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{typeLabel}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.file_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => handleView(d.file_path)} title="Voir">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id, d.file_path)} title="Supprimer">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Submit for review */}
        {canEdit && (
          <Button
            onClick={handleSubmitKyc}
            disabled={!canSubmit || submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {canSubmit ? 'Soumettre mon dossier pour validation' : 'Ajoutez au moins 2 documents pour soumettre'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
