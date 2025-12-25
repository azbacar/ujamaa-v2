import { useState, useEffect } from 'react';
import { AlertTriangle, Info, Bell, Wrench, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface UrgentAlert {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'maintenance';
  created_at: string;
}

const LiveUrgentAlerts = () => {
  const [alerts, setAlerts] = useState<UrgentAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissed_alerts');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    fetchAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('global_announcements_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_announcements',
        },
        (payload) => {
          console.log('Real-time alert update:', payload);
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as UrgentAlert;
            setAlerts((prev) => [newAlert, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setAlerts((prev) =>
              prev.map((a) => (a.id === payload.new.id ? (payload.new as UrgentAlert) : a))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('global_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    }
  };

  const dismissAlert = (id: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    try {
      localStorage.setItem('dismissed_alerts', JSON.stringify([...newDismissed]));
    } catch {
      // ignore
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          icon: AlertTriangle,
          className: 'border-red-500 bg-red-50 text-red-900',
          iconColor: 'text-red-600',
        };
      case 'warning':
        return {
          icon: Bell,
          className: 'border-yellow-500 bg-yellow-50 text-yellow-900',
          iconColor: 'text-yellow-600',
        };
      case 'maintenance':
        return {
          icon: Wrench,
          className: 'border-blue-500 bg-blue-50 text-blue-900',
          iconColor: 'text-blue-600',
        };
      default:
        return {
          icon: Info,
          className: 'border-emerald-500 bg-emerald-50 text-emerald-900',
          iconColor: 'text-emerald-600',
        };
    }
  };

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert) => {
        const styles = getAlertStyles(alert.type);
        const Icon = styles.icon;

        return (
          <Alert key={alert.id} className={`${styles.className} border-l-4 relative animate-slideIn`}>
            <Icon className={`h-4 w-4 ${styles.iconColor}`} />
            <AlertTitle className="font-semibold pr-8">{alert.title}</AlertTitle>
            <AlertDescription className="mt-1">{alert.content}</AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-60 hover:opacity-100"
              onClick={() => dismissAlert(alert.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        );
      })}
    </div>
  );
};

export default LiveUrgentAlerts;
