
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Activity,
  Calendar,
  Bell,
  ChevronRight,
  User,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AdminOverviewProps {
  userCount: number;
  pendingModifications: number;
  recentActions: any[];
  totalModifications: number;
}

export default function AdminOverview({ 
  userCount, 
  pendingModifications, 
  recentActions, 
  totalModifications 
}: AdminOverviewProps) {
  const quickStats = [
    {
      title: 'Utilisateurs totaux',
      value: userCount,
      icon: Users,
      color: 'blue',
      change: '+12%',
      description: 'Comptes actifs'
    },
    {
      title: 'En attente',
      value: pendingModifications,
      icon: Clock,
      color: 'orange',
      change: '-5%',
      description: 'Modifications à valider'
    },
    {
      title: 'Total modifications',
      value: totalModifications,
      icon: FileText,
      color: 'green',
      change: '+8%',
      description: 'Toutes modifications'
    },
    {
      title: 'Actions récentes',
      value: recentActions.length,
      icon: Activity,
      color: 'purple',
      change: '+15%',
      description: 'Actions administratives'
    }
  ];

  const quickActions = [
    {
      title: 'Créer une annonce',
      description: 'Publier un message pour tous les utilisateurs',
      icon: Bell,
      action: 'content'
    },
    {
      title: 'Gérer les utilisateurs',
      description: 'Modifier les rôles et permissions',
      icon: Users,
      action: 'users'
    },
    {
      title: 'Paramètres du site',
      description: 'Configuration générale',
      icon: Settings,
      action: 'site-control'
    }
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Tableau de bord administrateur
        </h2>
        <p className="text-slate-600">
          Gérez efficacement votre site web avec ces outils d'administration avancés.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-slate-200 bg-white hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          stat.change.startsWith('+') 
                            ? 'text-green-600 border-green-200 bg-green-50' 
                            : 'text-red-600 border-red-200 bg-red-50'
                        }`}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-slate-500">{stat.description}</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    stat.color === 'blue' ? 'bg-blue-100' :
                    stat.color === 'orange' ? 'bg-orange-100' :
                    stat.color === 'green' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      stat.color === 'blue' ? 'text-blue-600' :
                      stat.color === 'orange' ? 'text-orange-600' :
                      stat.color === 'green' ? 'text-green-600' :
                      'text-purple-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Actions */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Actions récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">Aucune action récente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActions.map((action, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {action.action_type.replace('_', ' ')}
                        </p>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(action.created_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {action.users?.username || 'Utilisateur'}
                        </Badge>
                        {action.target_type && (
                          <Badge variant="outline" className="text-xs">
                            {action.target_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{action.title}</h4>
                        <p className="text-sm text-slate-600">{action.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-600" />
            État du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-medium text-slate-900">Système opérationnel</h4>
              <p className="text-sm text-slate-500">Tous les services fonctionnent</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-medium text-slate-900">Performance optimale</h4>
              <p className="text-sm text-slate-500">Temps de réponse normal</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-medium text-slate-900">Dernière sauvegarde</h4>
              <p className="text-sm text-slate-500">Il y a 2 heures</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
