import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Activity,
  Database,
  Server,
  Globe,
  Clock,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemStats {
  totalUsers: number;
  totalContent: number;
  totalViews: number;
  pendingModifications: number;
  adminActions: number;
  databaseSize: string;
  uptime: string;
  lastBackup: string;
}

export default function SystemAnalyticsSection() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalContent: 0,
    totalViews: 0,
    pendingModifications: 0,
    adminActions: 0,
    databaseSize: '0 MB',
    uptime: '99.9%',
    lastBackup: 'Jamais'
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch content items count
      const { count: contentCount } = await supabase
        .from('content_items')
        .select('*', { count: 'exact', head: true });

      // Fetch total views
      const { data: viewsData } = await supabase
        .from('content_items')
        .select('views');
      
      const totalViews = viewsData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;

      // Fetch pending modifications
      const { count: pendingCount } = await supabase
        .from('pending_modifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch admin actions count
      const { count: actionsCount } = await supabase
        .from('admin_actions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 0,
        totalContent: contentCount || 0,
        totalViews,
        pendingModifications: pendingCount || 0,
        adminActions: actionsCount || 0,
        databaseSize: '2.4 MB', // Mock data
        uptime: '99.9%', // Mock data
        lastBackup: new Date().toLocaleDateString('fr-FR')
      });

    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    toast.success('Export des données initié');
  };

  const analyticsCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Contenu publié',
      value: stats.totalContent,
      icon: Database,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Vues totales',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'purple',
      change: '+25%'
    },
    {
      title: 'Actions admin',
      value: stats.adminActions,
      icon: Activity,
      color: 'orange',
      change: '+5%'
    }
  ];

  const systemHealth = [
    {
      label: 'Temps de fonctionnement',
      value: stats.uptime,
      status: 'excellent'
    },
    {
      label: 'Taille base de données',
      value: stats.databaseSize,
      status: 'good'
    },
    {
      label: 'Dernière sauvegarde',
      value: stats.lastBackup,
      status: 'good'
    },
    {
      label: 'Modifications en attente',
      value: stats.pendingModifications.toString(),
      status: stats.pendingModifications > 5 ? 'warning' : 'good'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analyses du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analyticsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="text-center p-6 border border-slate-200 rounded-xl bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all duration-300">
                  <Icon className={`h-8 w-8 mx-auto mb-3 text-${card.color}-600`} />
                  <div className="text-3xl font-bold text-slate-900 mb-1">{card.value}</div>
                  <div className="text-sm text-slate-600 mb-2">{card.title}</div>
                  <Badge className={`text-xs ${card.change.startsWith('+') ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {card.change}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <Server className="h-5 w-5" />
            État du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemHealth.map((item, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-lg font-semibold text-slate-700 mt-1">{item.value}</p>
                  </div>
                  <Badge className={`${getStatusColor(item.status)}`}>
                    {item.status === 'excellent' && '✓'}
                    {item.status === 'good' && '●'}
                    {item.status === 'warning' && '⚠'}
                    {item.status === 'error' && '✗'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traffic Analytics */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Trafic et utilisation
            </CardTitle>
            <Button 
              onClick={handleExportData}
              variant="outline" 
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Content */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Contenu populaire
              </h3>
              <div className="space-y-3">
                {[
                  { title: 'Services passeports', views: 3200, type: 'service' },
                  { title: 'Festival Culture', views: 2100, type: 'event' },
                  { title: 'Réglementation visas', views: 1250, type: 'announcement' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.type}</p>
                    </div>
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      {item.views} vues
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activité récente
              </h3>
              <div className="space-y-3">
                {[
                  { action: 'Nouvelle inscription utilisateur', time: 'Il y a 5 min' },
                  { action: 'Contenu publié', time: 'Il y a 12 min' },
                  { action: 'Modification approuvée', time: 'Il y a 23 min' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{item.action}</p>
                      <p className="text-sm text-slate-600">{item.time}</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}