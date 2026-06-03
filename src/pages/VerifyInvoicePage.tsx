import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, FileText, Building2, User, Calendar, Hash, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePageSEO } from '@/hooks/usePageSEO';

interface InvoiceVerification {
  invoice_number: string;
  type: string;
  status: string;
  issue_date: string;
  total: number;
  currency: string;
  client_name: string | null;
  enterprise_name: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  invoice: 'Facture',
  quote: 'Devis',
  credit_note: 'Avoir',
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-500' },
  sent: { label: 'Envoyée', color: 'bg-blue-500' },
  paid: { label: 'Payée', color: 'bg-green-600' },
  overdue: { label: 'En retard', color: 'bg-red-500' },
  cancelled: { label: 'Annulée', color: 'bg-zinc-700' },
};

export default function VerifyInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InvoiceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageSEO({
    title: 'Vérification de document — Ujamaan',
    description: 'Vérifiez l\'authenticité d\'une facture ou d\'un devis émis via Ujamaan.',
  });

  useEffect(() => {
    if (!id) { setLoading(false); setNotFound(true); return; }
    (async () => {
      const { data, error } = await (supabase as any).rpc('get_invoice_verification', { _id: id });
      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setNotFound(true);
      } else {
        setData((Array.isArray(data) ? data[0] : data) as InvoiceVerification);
      }
      setLoading(false);

    })();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-blue-50">
      <Header />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <FileText className="h-12 w-12 mx-auto text-emerald-700" />
          <h1 className="text-2xl md:text-3xl font-bold mt-3">Vérification de document</h1>
          <p className="text-muted-foreground text-sm">Ujamaan — service de vérification d'authenticité</p>
        </div>

        {loading && (
          <Card><CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-emerald-700" />
            <p className="mt-3 text-muted-foreground">Vérification en cours...</p>
          </CardContent></Card>
        )}

        {!loading && notFound && (
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="h-6 w-6" /> Document introuvable
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Aucun document correspondant à cet identifiant n'a été trouvé dans nos registres.</p>
              <p className="text-sm text-muted-foreground">
                Si vous pensez que c'est une erreur, contactez l'émetteur du document.
              </p>
              <Button asChild variant="outline"><Link to="/">Retour à l'accueil</Link></Button>
            </CardContent>
          </Card>
        )}

        {!loading && data && (
          <Card className="border-emerald-300 shadow-lg">
            <CardHeader className="bg-emerald-50/50 border-b">
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="h-6 w-6" /> Document authentique
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ce {TYPE_LABEL[data.type]?.toLowerCase() || 'document'} a bien été émis via Ujamaan.
              </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {TYPE_LABEL[data.type] || data.type}
                </Badge>
                <Badge className={`${STATUS_LABEL[data.status]?.color || 'bg-gray-500'} text-white`}>
                  {STATUS_LABEL[data.status]?.label || data.status}
                </Badge>
              </div>

              <div className="grid gap-3 text-sm">
                <Row icon={<Hash className="h-4 w-4" />} label="N° document" value={data.invoice_number} />
                <Row icon={<Calendar className="h-4 w-4" />} label="Date d'émission" value={new Date(data.issue_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <Row icon={<Building2 className="h-4 w-4" />} label="Émetteur" value={data.enterprise_name || '—'} />
                <Row icon={<User className="h-4 w-4" />} label="Client" value={data.client_name || '—'} />
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-muted-foreground mb-1">Montant total</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {Number(data.total).toLocaleString('fr-FR')} {data.currency}
                </p>
              </div>

              <div className="text-xs text-muted-foreground italic pt-3 border-t">
                ℹ️ Pour des raisons de confidentialité, seules les informations essentielles de vérification sont affichées.
                Le détail des articles n'est pas public.
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded bg-muted/40">
      <div className="text-emerald-700">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
