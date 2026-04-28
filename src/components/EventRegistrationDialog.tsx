import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Ticket, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MvolaPaymentDialog from '@/components/MvolaPaymentDialog';
import { authPath, proPath } from '@/lib/authRedirect';

interface EventRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    price: number;
    currency: string;
    requires_payment: boolean;
  };
  onSuccess: () => void;
}

const EventRegistrationDialog = ({ open, onOpenChange, event, onSuccess }: EventRegistrationDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState({
    phone: '',
    dietary_restrictions: '',
    special_needs: ''
  });

  const handleRegister = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour vous inscrire');
      navigate(authPath());
      return;
    }

    if (!acceptTerms) {
      toast.error('Veuillez accepter les conditions');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: event.id,
          user_id: user.id,
          payment_amount: event.requires_payment ? event.price : null,
          additional_info: additionalInfo
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Vous êtes déjà inscrit à cet événement');
        } else {
          throw error;
        }
        return;
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Inscription confirmée',
        message: `Votre inscription à "${event.title}" a été confirmée. Code: ${data.ticket_code}`,
        type: 'info',
        link: '/profile'
      });

      if (event.requires_payment && event.price > 0) {
        setRegistrationId(data.id);
        setShowPayment(true);
        toast.success(`Inscription enregistrée ! Code: ${data.ticket_code}. Procédez au paiement.`);
      } else {
        toast.success(`Inscription confirmée ! Votre code: ${data.ticket_code}`);
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      toast.error('Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (method: 'mvola' | 'cash' | 'card', reference: string) => {
    if (!registrationId) return;
    const { error } = await supabase
      .from('event_registrations')
      .update({ payment_status: 'pending_verification', additional_info: { ...additionalInfo, payment_method: method, payment_reference: reference } } as any)
      .eq('id', registrationId);
    if (error) throw error;
    toast.success('Paiement soumis ! Validation en cours.');
    setShowPayment(false);
    onSuccess();
    onOpenChange(false);
  };

  const userRef = user ? ('EVT' + user.id.replace(/-/g, '').slice(0, 12)).toUpperCase() : 'EVTUJAMAAN';

  return (
    <>
      <Dialog open={open && !showPayment} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Inscription à l'événement
            </DialogTitle>
            <DialogDescription>
              {event.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {event.requires_payment && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold mb-2">
                  <CreditCard className="w-4 h-4" />
                  Prix du billet
                </div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {event.price} {event.currency}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone de contact</Label>
              <Input
                id="phone"
                placeholder="+269 77 12 34 56"
                value={additionalInfo.phone}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietary">Restrictions alimentaires (optionnel)</Label>
              <Input
                id="dietary"
                placeholder="Végétarien, allergies, etc."
                value={additionalInfo.dietary_restrictions}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, dietary_restrictions: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="needs">Besoins spéciaux (optionnel)</Label>
              <Input
                id="needs"
                placeholder="Accessibilité, assistance, etc."
                value={additionalInfo.special_needs}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, special_needs: e.target.value })}
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                J'accepte les conditions et je confirme ma participation à cet événement
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleRegister} disabled={loading || !acceptTerms}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Inscription...</>
              ) : (
                <><Ticket className="w-4 h-4 mr-2" /> {event.requires_payment ? 'Continuer vers le paiement' : 'Confirmer l\'inscription'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mvola payment for paid events */}
      <MvolaPaymentDialog
        open={showPayment}
        onOpenChange={(o) => {
          if (!o) {
            setShowPayment(false);
            onSuccess();
            onOpenChange(false);
          }
        }}
        amount={event.price}
        currency={event.currency}
        label={`Paiement : ${event.title}`}
        userRef={userRef}
        onPaymentSubmit={handlePaymentSubmit}
      />
    </>
  );
};

export default EventRegistrationDialog;
