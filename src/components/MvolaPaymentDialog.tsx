import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Banknote, CreditCard, Lock, Phone, QrCode, Copy, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface MvolaPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency?: string;
  label: string;
  description?: string;
  userRef: string; // max 15 chars, unique per user
  onPaymentSubmit: (method: 'mvola' | 'cash' | 'card', reference: string) => Promise<void>;
}

const MVOLA_MERCHANT = '4102122';

function generateUSSD(amount: number, userRef: string) {
  const cleanRef = userRef.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
  return `*444*1*2*${MVOLA_MERCHANT}*${amount}*${cleanRef}#`;
}

export default function MvolaPaymentDialog({
  open,
  onOpenChange,
  amount,
  currency = 'FC',
  label,
  description,
  userRef,
  onPaymentSubmit,
}: MvolaPaymentDialogProps) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<string>(isMobile ? 'mvola' : 'mvola');
  const [paymentRef, setPaymentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const ussdCode = useMemo(() => generateUSSD(amount, userRef), [amount, userRef]);
  const telLink = `tel:${encodeURIComponent(ussdCode)}`;

  const handleSubmit = async (method: 'mvola' | 'cash' | 'card') => {
    if (method !== 'card' && !paymentRef.trim()) {
      toast.error('Veuillez entrer la référence de paiement');
      return;
    }
    setSubmitting(true);
    try {
      await onPaymentSubmit(method, paymentRef.trim());
      setPaymentRef('');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  const copyUSSD = () => {
    navigator.clipboard.writeText(ussdCode).then(() => {
      setCopied(true);
      toast.success('Code USSD copié !');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {label}
          </DialogTitle>
          <DialogDescription>
            {description || `Montant : ${amount.toLocaleString()} ${currency}`}
          </DialogDescription>
        </DialogHeader>

        {/* Amount display */}
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Montant à payer</p>
          <p className="text-3xl font-bold text-primary">{amount.toLocaleString()} {currency}</p>
          <Badge variant="outline" className="mt-1 text-xs">
            Réf: {userRef.slice(0, 15)}
          </Badge>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mvola" className="text-xs sm:text-sm gap-1">
              <Smartphone className="w-3.5 h-3.5" /> Mvola
            </TabsTrigger>
            <TabsTrigger value="cash" className="text-xs sm:text-sm gap-1">
              <Banknote className="w-3.5 h-3.5" /> Dépôt
            </TabsTrigger>
            <TabsTrigger value="card" className="text-xs sm:text-sm gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Carte
            </TabsTrigger>
          </TabsList>

          {/* Mvola USSD */}
          <TabsContent value="mvola" className="space-y-4 mt-4">
            <Card className="bg-muted/50 border-primary/20">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Paiement Mvola (USSD)
                </h4>

                {/* USSD Code display */}
                <div className="bg-background rounded-lg p-4 border border-primary/30">
                  <p className="text-xs text-muted-foreground text-center mb-2">Code USSD à composer :</p>
                  <div className="text-center">
                    <code className="text-lg sm:text-xl font-mono font-bold text-primary break-all">
                      {ussdCode}
                    </code>
                  </div>

                  <div className="flex gap-2 mt-3 justify-center">
                    {isMobile ? (
                      <Button asChild className="gap-2 flex-1">
                        <a href={telLink}>
                          <Phone className="w-4 h-4" />
                          Composer maintenant
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={copyUSSD} className="gap-2">
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copié !' : 'Copier le code'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* QR Code for desktop */}
                {!isMobile && (
                  <div className="bg-background rounded-lg p-4 border text-center">
                    <p className="text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1">
                      <QrCode className="w-3.5 h-3.5" />
                      Scannez avec votre téléphone pour composer
                    </p>
                    <div className="inline-block bg-white p-3 rounded-lg">
                      <QRCodeSVG
                        value={telLink}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Le QR code ouvrira le numéroteur avec le code USSD pré-rempli
                    </p>
                  </div>
                )}

                {/* Steps */}
                <div className="border-t border-border pt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p>1️⃣ {isMobile ? 'Appuyez sur "Composer maintenant"' : 'Scannez le QR code ou copiez le code USSD'}</p>
                  <p>2️⃣ Confirmez avec votre code PIN Mvola</p>
                  <p>3️⃣ Notez le numéro de transaction reçu par SMS</p>
                  <p>4️⃣ Entrez-le ci-dessous pour valider</p>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label className="text-sm">N° de transaction Mvola *</Label>
              <Input
                placeholder="Ex: MP260407.1234.A56789"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={() => handleSubmit('mvola')} disabled={submitting}>
              {submitting ? 'Envoi...' : 'Confirmer le paiement Mvola'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              ⏱️ Validation sous 12h après vérification
            </p>
          </TabsContent>

          {/* Cash / Dépôt */}
          <TabsContent value="cash" className="space-y-4 mt-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-foreground">📋 Dépôt en espèces</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Virement bancaire :</strong></p>
                  <p>🏦 Banque : BIC Comores</p>
                  <p>👤 Titulaire : UJAMAA SARL</p>
                  <p>📝 IBAN : KM46 00006 00001 0 0010061829 73</p>
                  <p className="border-t border-border pt-2 mt-2"><strong>Ou espèces :</strong></p>
                  <p>📍 Moroni : ESPACE BEINNOV, Rond Point Yemenia, Rue des Douanes à 10m de la DRS</p>
                  <p>📍 Mutsamudu : Bientôt</p>
                  <p>📍 Fomboni : Bientôt</p>
                  <p className="text-xs mt-2">🕐 Lun-Sam 8h-17h</p>
                  <p className="border-t border-border pt-2 mt-2 text-xs">
                    <strong>Important :</strong> Mentionnez votre référence <Badge variant="outline" className="text-[10px]">{userRef.slice(0, 15)}</Badge> lors du dépôt
                  </p>
                </div>
              </CardContent>
            </Card>
            <div>
              <Label className="text-sm">Référence du paiement / N° de reçu *</Label>
              <Input
                placeholder="Ex: REC-2026-001 ou numéro de transaction"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={() => handleSubmit('cash')} disabled={submitting}>
              {submitting ? 'Envoi...' : 'Soumettre pour validation'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              ⏱️ Validation sous 24h par notre équipe
            </p>
          </TabsContent>

          {/* Carte bancaire */}
          <TabsContent value="card" className="space-y-4 mt-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center space-y-3">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground" />
                <h4 className="font-semibold text-sm text-foreground">Paiement par carte bancaire</h4>
                <p className="text-sm text-muted-foreground">
                  Le paiement par carte sera bientôt disponible via Stripe. En attendant, utilisez Mvola ou le dépôt.
                </p>
              </CardContent>
            </Card>
            <Button className="w-full" disabled variant="outline">
              <Lock className="w-4 h-4 mr-2" /> Bientôt disponible
            </Button>
          </TabsContent>
        </Tabs>

        <div className="bg-accent/50 rounded-lg p-3 mt-2">
          <p className="text-xs text-muted-foreground">
            🔒 Paiement sécurisé. Votre compte sera mis à jour après vérification.
            En cas de problème : <strong>support@ujamaan.com</strong>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
