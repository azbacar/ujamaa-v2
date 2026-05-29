import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { authPath } from '@/lib/authRedirect';

// PayPal Sandbox client ID is fetched at runtime from edge function `paypal-config`.
let cachedClientId: string | null = null;
async function getPayPalClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;
  const { data, error } = await supabase.functions.invoke('paypal-config');
  if (error || !data?.client_id) throw new Error('PayPal config unavailable');
  cachedClientId = data.client_id;
  return cachedClientId!;
}


// Approximate conversion rates (KMF base). Update as needed or move to settings later.
const CONVERSION = {
  EUR: 492, // 1 EUR ≈ 492 KMF
  USD: 455, // 1 USD ≈ 455 KMF
};

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  /** Amount in KMF (will be converted to selected currency for PayPal) */
  amountKMF: number;
  /** Free text shown on the PayPal receipt */
  description: string;
  /** Where the payment will be recorded server-side */
  purpose: 'pro_subscription' | 'investment' | 'event';
  /** Extra data passed to the capture function */
  metadata?: Record<string, any>;
  onSuccess?: (captureId: string) => void;
  onError?: (err: any) => void;
  /** Default currency, user can switch */
  defaultCurrency?: 'EUR' | 'USD';
}

function detectDefaultCurrency(): 'EUR' | 'USD' {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    // Americas → USD, otherwise EUR
    if (/America|US|Pacific\/Honolulu/i.test(tz)) return 'USD';
    return 'EUR';
  } catch {
    return 'EUR';
  }
}

export default function PayPalButton({
  amountKMF,
  description,
  purpose,
  metadata,
  onSuccess,
  onError,
  defaultCurrency,
}: PayPalButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const [currency, setCurrency] = useState<'EUR' | 'USD'>(defaultCurrency || detectDefaultCurrency());
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const convertedAmount = Math.max(0.5, +(amountKMF / CONVERSION[currency]).toFixed(2));

  // Load PayPal SDK whenever currency changes
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setSdkReady(false);
    const existing = document.querySelector('script[data-paypal-sdk]');
    if (existing) existing.remove();
    if (window.paypal) delete window.paypal;

    (async () => {
      try {
        const clientId = await getPayPalClientId();
        if (cancelled) return;
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=capture`;
        script.async = true;
        script.setAttribute('data-paypal-sdk', currency);
        script.onload = () => { if (!cancelled) setSdkReady(true); };
        script.onerror = () => toast.error('Impossible de charger PayPal');
        document.body.appendChild(script);
      } catch {
        toast.error('Configuration PayPal indisponible');
      }
    })();
    return () => { cancelled = true; };
  }, [currency]);


  // Render buttons when SDK ready or amount changes
  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current) return;
    containerRef.current.innerHTML = '';

    window.paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
      createOrder: async () => {
        setProcessing(true);
        try {
          const { data, error } = await supabase.functions.invoke('paypal-create-order', {
            body: {
              amount: convertedAmount,
              currency,
              description,
              purpose,
              metadata,
            },
          });
          if (error) throw error;
          if (!data?.id) throw new Error('Order ID missing');
          return data.id;
        } catch (e: any) {
          toast.error('Erreur création commande PayPal');
          setProcessing(false);
          throw e;
        }
      },
      onApprove: async (data: any) => {
        try {
          const { data: capData, error } = await supabase.functions.invoke('paypal-capture-order', {
            body: {
              order_id: data.orderID,
              purpose,
              metadata: {
                ...(metadata || {}),
                amount_kmf: amountKMF,
                amount_native: convertedAmount,
                currency_native: currency,
              },
            },
          });
          if (error) throw error;
          toast.success('Paiement PayPal confirmé !');
          onSuccess?.(capData?.capture_id || data.orderID);
        } catch (e: any) {
          console.error(e);
          toast.error('Le paiement a été reçu mais l\'enregistrement a échoué. Contactez le support.');
          onError?.(e);
        } finally {
          setProcessing(false);
        }
      },
      onCancel: () => {
        setProcessing(false);
        toast.info('Paiement PayPal annulé');
      },
      onError: (err: any) => {
        console.error('PayPal error', err);
        setProcessing(false);
        toast.error('Erreur PayPal');
        onError?.(err);
      },
    }).render(containerRef.current);
  }, [sdkReady, convertedAmount, currency, amountKMF, description, purpose, JSON.stringify(metadata)]);

  if (!authLoading && !user) {
    return (
      <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-center space-y-3">
        <p className="text-sm font-medium">Connexion requise pour payer avec PayPal</p>
        <p className="text-xs text-muted-foreground">
          Vous devez être connecté à votre compte Ujamaan pour effectuer un paiement sécurisé et recevoir votre reçu.
        </p>
        <Button asChild size="sm" className="w-full">
          <Link to={authPath()}>
            <LogIn className="h-4 w-4 mr-2" /> Se connecter / Créer un compte
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Devise PayPal</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as 'EUR' | 'USD')}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">À payer</p>
          <p className="font-bold text-base">
            {convertedAmount} {currency}
          </p>
          <p className="text-[10px] text-muted-foreground">≈ {amountKMF.toLocaleString()} KMF</p>
        </div>
      </div>

      {!sdkReady ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Chargement PayPal…
        </div>
      ) : (
        <div ref={containerRef} />
      )}
      {processing && (
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Traitement en cours…
        </p>
      )}
      <p className="text-[10px] text-center text-muted-foreground">
        Mode Sandbox PayPal • Taux indicatif : 1 EUR ≈ 492 KMF, 1 USD ≈ 455 KMF
      </p>
    </div>
  );
}
