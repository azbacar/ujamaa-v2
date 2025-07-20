import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nouvelle alerte météo',
      message: 'Avis de tempête prévu sur Grande Comore dans les prochaines 24h',
      type: 'warning',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
      read: false
    },
    {
      id: '2',
      title: 'Appel d\'offres urgent',
      message: 'Nouveau marché public pour la construction d\'un centre de santé',
      type: 'info',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // Il y a 4h
      read: false
    },
    {
      id: '3',
      title: 'Mise à jour des prix',
      message: 'Les prix du marché de Moroni ont été actualisés',
      type: 'success',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // Il y a 6h
      read: true
    }
  ]);
  
  const [showPanel, setShowPanel] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { toast } = useToast();

  // Demander la permission pour les notifications
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        // La permission sera demandée lors du premier clic
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPermissionGranted(true);
        toast({
          title: "Notifications activées",
          description: "Vous recevrez maintenant les alertes importantes",
        });
        // Envoyer une notification de test
        new Notification('UJAMAA - Notifications activées', {
          body: 'Vous recevrez maintenant toutes les alertes importantes des Comores',
          icon: '/favicon.ico'
        });
      } else {
        toast({
          title: "Notifications refusées",
          description: "Vous pouvez les activer plus tard dans les paramètres de votre navigateur",
          variant: "destructive"
        });
      }
    }
  };

  const sendNotification = (notification: Notification) => {
    if (permissionGranted && 'Notification' in window) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notif,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    sendNotification(newNotification);
    
    // Afficher aussi un toast
    toast({
      title: notif.title,
      description: notif.message,
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Il y a ${diffHours}h`;
    return 'À l\'instant';
  };

  // Simuler l'arrivée de nouvelles notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% de chance toutes les 30s
        const types = ['info', 'warning', 'success'] as const;
        const messages = [
          { title: 'Nouveau prix disponible', message: 'Les prix du marché de Mutsamudu ont été mis à jour' },
          { title: 'Événement à venir', message: 'Festival culturel prévu ce weekend à Fomboni' },
          { title: 'Service administratif', message: 'La préfecture sera fermée demain pour maintenance' },
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        addNotification({
          ...randomMessage,
          type: randomType,
          read: false
        });
      }
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [permissionGranted]);

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm" 
        className="h-12 w-12 rounded-xl border-emerald-200 bg-white/80 hover:bg-emerald-50 relative"
        onClick={() => {
          if (!permissionGranted) {
            requestNotificationPermission();
          }
          setShowPanel(!showPanel);
        }}
      >
        <Bell className="w-5 h-5 text-emerald-600" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs animate-pulse">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showPanel && (
        <div className="absolute right-0 top-14 w-96 max-h-96 overflow-hidden bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-ocean-500 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowPanel(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {!permissionGranted && (
              <Button
                size="sm"
                className="w-full mt-2 bg-white text-emerald-600 hover:bg-gray-50"
                onClick={requestNotificationPermission}
              >
                Activer les notifications
              </Button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Aucune notification
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    // Rediriger vers la page appropriée selon le type de notification
                    if (notification.title.includes('prix') || notification.title.includes('marché')) {
                      window.location.href = '/prix';
                    } else if (notification.title.includes('événement') || notification.title.includes('festival')) {
                      window.location.href = '/evenements';
                    } else if (notification.title.includes('service') || notification.title.includes('administratif')) {
                      window.location.href = '/services';
                    } else {
                      window.location.href = '/annonces';
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-1 rounded-full ${getTypeColor(notification.type)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;