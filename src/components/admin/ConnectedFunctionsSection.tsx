import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Link2, 
  CheckCircle, 
  AlertTriangle, 
  Database,
  Users,
  FileText,
  Bell,
  BarChart3,
  Shield,
  RefreshCw,
  Eye,
  Play,
  Pause
} from 'lucide-react';

const ConnectedFunctionsSection = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    database: 'connected',
    auth: 'connected',
    notifications: 'connected',
    analytics: 'connected',
    storage: 'connected',
    api: 'warning'
  });

  const functions = [
    {
      id: 'price_management',
      name: 'Gestion des Prix',
      description: 'Soumission et validation des prix de marché',
      status: 'active',
      lastSync: '2 min',
      icon: Database,
      adminConnected: true,
      userSubmissions: 24,
      pendingReviews: 3
    },
    {
      id: 'announcements',
      name: 'Système d\'Annonces',
      description: 'Publication et gestion des annonces officielles',
      status: 'active',
      lastSync: '5 min',
      icon: FileText,
      adminConnected: true,
      totalAnnouncements: 18,
      activeAnnouncements: 15
    },
    {
      id: 'user_management',
      name: 'Gestion Utilisateurs',
      description: 'Administration des comptes et rôles',
      status: 'active',
      lastSync: '1 min',
      icon: Users,
      adminConnected: true,
      totalUsers: 156,
      activeUsers: 89
    },
    {
      id: 'notifications',
      name: 'Notifications Push',
      description: 'Alertes temps réel et notifications',
      status: 'active',
      lastSync: '30 sec',
      icon: Bell,
      adminConnected: true,
      sentToday: 42,
      deliveryRate: '98%'
    },
    {
      id: 'analytics',
      name: 'Analytics & Rapports',
      description: 'Statistiques d\'usage et rapports détaillés',
      status: 'active',
      lastSync: '10 min',
      icon: BarChart3,
      adminConnected: true,
      dailyVisits: 234,
      monthlyGrowth: '+12%'
    },
    {
      id: 'security',
      name: 'Sécurité & Audit',
      description: 'Logs de sécurité et surveillance',
      status: 'warning',
      lastSync: '1h',
      icon: Shield,
      adminConnected: false,
      securityEvents: 0,
      threatLevel: 'Bas'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <RefreshCw className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleToggleFunction = (functionId: string) => {
    console.log(`Toggling function: ${functionId}`);
    // Ici vous pourriez implémenter la logique pour activer/désactiver une fonction
  };

  const handleSyncFunction = (functionId: string) => {
    console.log(`Syncing function: ${functionId}`);
    // Ici vous pourriez implémenter la synchronisation manuelle
  };

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble des connexions */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-admin-primary" />
            État des Connexions Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(connectionStatus).map(([service, status]) => (
              <div key={service} className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  status === 'connected' ? 'bg-emerald-500' : 
                  status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                }`} />
                <p className="text-xs font-medium capitalize">{service}</p>
                <p className={`text-xs ${
                  status === 'connected' ? 'text-emerald-600' : 
                  status === 'warning' ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {status === 'connected' ? 'Connecté' : 
                   status === 'warning' ? 'Attention' : 'Erreur'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des fonctions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {functions.map((func) => (
          <Card key={func.id} className="admin-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-admin-primary/10">
                    <func.icon className="w-5 h-5 text-admin-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{func.name}</CardTitle>
                    <p className="text-sm text-gray-600">{func.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(func.status)}>
                  {getStatusIcon(func.status)}
                  <span className="ml-1 capitalize">{func.status === 'active' ? 'Actif' : func.status === 'warning' ? 'Attention' : 'Erreur'}</span>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Métriques */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {func.id === 'price_management' && (
                  <>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-admin-primary">{func.userSubmissions}</p>
                      <p className="text-gray-600">Soumissions</p>
                    </div>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-orange-600">{func.pendingReviews}</p>
                      <p className="text-gray-600">En attente</p>
                    </div>
                  </>
                )}
                
                {func.id === 'announcements' && (
                  <>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-admin-primary">{func.totalAnnouncements}</p>
                      <p className="text-gray-600">Total</p>
                    </div>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-emerald-600">{func.activeAnnouncements}</p>
                      <p className="text-gray-600">Actives</p>
                    </div>
                  </>
                )}
                
                {func.id === 'user_management' && (
                  <>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-admin-primary">{func.totalUsers}</p>
                      <p className="text-gray-600">Utilisateurs</p>
                    </div>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-emerald-600">{func.activeUsers}</p>
                      <p className="text-gray-600">Actifs</p>
                    </div>
                  </>
                )}
                
                {func.id === 'notifications' && (
                  <>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-admin-primary">{func.sentToday}</p>
                      <p className="text-gray-600">Envoyées</p>
                    </div>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-emerald-600">{func.deliveryRate}</p>
                      <p className="text-gray-600">Taux livraison</p>
                    </div>
                  </>
                )}
                
                {func.id === 'analytics' && (
                  <>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-admin-primary">{func.dailyVisits}</p>
                      <p className="text-gray-600">Visites/jour</p>
                    </div>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-emerald-600">{func.monthlyGrowth}</p>
                      <p className="text-gray-600">Croissance</p>
                    </div>
                  </>
                )}
                
                {func.id === 'security' && (
                  <>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-admin-primary">{func.securityEvents}</p>
                      <p className="text-gray-600">Événements</p>
                    </div>
                    <div className="text-center p-2 bg-admin-surface rounded-lg">
                      <p className="font-semibold text-emerald-600">{func.threatLevel}</p>
                      <p className="text-gray-600">Menace</p>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync: {func.lastSync}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSyncFunction(func.id)}
                    className="h-8 px-3"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Sync
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleFunction(func.id)}
                    className={`h-8 px-3 ${func.status === 'active' ? 'text-orange-600 hover:text-orange-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                  >
                    {func.status === 'active' ? (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Détails
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration globale */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-admin-primary" />
            Configuration Système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Fréquence de synchronisation
              </label>
              <Select defaultValue="5min">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1min">Toutes les minutes</SelectItem>
                  <SelectItem value="5min">Toutes les 5 minutes</SelectItem>
                  <SelectItem value="15min">Toutes les 15 minutes</SelectItem>
                  <SelectItem value="30min">Toutes les 30 minutes</SelectItem>
                  <SelectItem value="1h">Toutes les heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Niveau de logs
              </label>
              <Select defaultValue="info">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline">
              Tester les connexions
            </Button>
            <Button className="bg-admin-primary hover:bg-admin-primary/90">
              Sauvegarder la configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectedFunctionsSection;