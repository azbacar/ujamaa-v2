import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const PROMPT_DISMISS_KEY = 'push_prompt_dismissed';
const PROMPT_VISIT_COUNT_KEY = 'push_prompt_visits';
const VISITS_BEFORE_PROMPT = 3;

const PushNotificationPrompt = () => {
  const { user } = useAuth();
  const { permission, isSubscribed, subscribe, isSupported, loading } = usePushNotifications();
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || !isSupported || isSubscribed || permission === 'denied') {
      setVisible(false);
      return;
    }

    const dismissed = localStorage.getItem(PROMPT_DISMISS_KEY);
    if (dismissed) {
      const dismissDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return; // Don't show for 7 days after dismiss
    }

    const visits = parseInt(localStorage.getItem(PROMPT_VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(PROMPT_VISIT_COUNT_KEY, String(visits));

    if (visits >= VISITS_BEFORE_PROMPT) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, isSupported, isSubscribed, permission]);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: '🔔 Notifications activées !',
        description: 'Vous serez informé des nouveaux événements et annonces.',
      });
    } else {
      toast({
        title: 'Notifications refusées',
        description: 'Vous pouvez les activer plus tard dans les paramètres.',
        variant: 'destructive',
      });
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISS_KEY, new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground">
              Activer les notifications ?
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Recevez les alertes urgentes, nouveaux événements et annonces importantes des Comores.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleSubscribe}
                disabled={loading}
                className="text-xs"
              >
                {loading ? 'Activation...' : 'Activer'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs text-muted-foreground"
              >
                Plus tard
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
