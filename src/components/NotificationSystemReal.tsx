import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, AlertTriangle, Info, CheckCircle, BellRing, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNavigate } from 'react-router-dom';

const NotificationSystemReal = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { toast } = useToast();
  const { notifications, loading, markAsRead, deleteNotification } = useRealTimeNotifications();
  const navigate = useNavigate();

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPermissionGranted(true);
        toast({
          title: "Notifications activées",
          description: "Vous recevrez maintenant les alertes importantes",
        });
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
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'success': return 'text-emerald-600 bg-emerald-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-ocean-600 bg-ocean-50';
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

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    setShowPanel(false);
    
    if (notification.link) {
      navigate(notification.link);
    } else {
      // Rediriger selon le contenu
      if (notification.title.includes('prix') || notification.title.includes('marché')) {
        navigate('/prix');
      } else if (notification.title.includes('événement') || notification.title.includes('festival') || notification.title.includes('inscription')) {
        navigate('/evenements');
      } else if (notification.title.includes('service') || notification.title.includes('administratif')) {
        navigate('/services');
      } else {
        navigate('/annonces');
      }
    }
  };

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
        <>
          {/* Backdrop mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 sm:hidden" 
            onClick={() => setShowPanel(false)} 
          />
          <div className="fixed inset-x-3 top-20 bottom-auto sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:w-96 max-h-[70vh] sm:max-h-96 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-2xl border border-blue-200 z-50 text-foreground">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-ocean-500 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm sm:text-base">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  onClick={() => setShowPanel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {!permissionGranted && (
                <Button
                  size="sm"
                  className="w-full mt-2 bg-white text-emerald-600 hover:bg-gray-50 text-xs sm:text-sm"
                  onClick={requestNotificationPermission}
                >
                  Activer les notifications
                </Button>
              )}
            </div>
            
            <div className="max-h-[55vh] sm:max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Chargement...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`p-1 rounded-full flex-shrink-0 ${getTypeColor(notification.type)}`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm truncate">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
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
        </>
      )}
    </div>
  );
};

export default NotificationSystemReal;
