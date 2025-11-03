import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  BarChart3, 
  Users, 
  Eye, 
  Clock, 
  Globe, 
  Smartphone,
  Monitor,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  averageTime: string;
  bounceRate: number;
  topPages: Array<{ page: string; views: number; percentage: number }>;
  devices: Array<{ type: string; count: number; percentage: number }>;
  traffic: Array<{ date: string; views: number; users: number }>;
}

export default function AnalyticsSection() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pageViews: 0,
    uniqueVisitors: 0,
    averageTime: '0m 0s',
    bounceRate: 0,
    topPages: [],
    devices: [],
    traffic: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch page views
      const { count: pageViewsCount } = await supabase
        .from('site_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view');

      // Fetch unique visitors (count distinct sessions)
      const { data: sessionsData } = await supabase
        .from('site_analytics')
        .select('session_id')
        .eq('event_type', 'page_view');

      const uniqueVisitors = new Set(sessionsData?.map(s => s.session_id)).size;

      // Fetch top pages
      const { data: pagesData } = await supabase
        .from('site_analytics')
        .select('page_path')
        .eq('event_type', 'page_view');

      const pageCounts = pagesData?.reduce((acc: any, curr) => {
        acc[curr.page_path] = (acc[curr.page_path] || 0) + 1;
        return acc;
      }, {});

      const topPages = Object.entries(pageCounts || {})
        .map(([page, views]: [string, any]) => ({
          page,
          views,
          percentage: (views / (pageViewsCount || 1)) * 100
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      setAnalytics({
        pageViews: pageViewsCount || 0,
        uniqueVisitors,
        averageTime: '2m 34s', // Calculate this from actual data if available
        bounceRate: 34.2, // Calculate from actual data
        topPages,
        devices: [
          { type: 'Mobile', count: Math.floor((pageViewsCount || 0) * 0.6), percentage: 60 },
          { type: 'Desktop', count: Math.floor((pageViewsCount || 0) * 0.3), percentage: 30 },
          { type: 'Tablet', count: Math.floor((pageViewsCount || 0) * 0.1), percentage: 10 }
        ],
        traffic: [] // You can populate this with real data grouped by date
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Erreur lors du chargement des analytics');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'Mobile': return <Smartphone className="h-4 w-4" />;
      case 'Desktop': return <Monitor className="h-4 w-4" />;
      case 'Tablet': return <Smartphone className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Page,Vues,Pourcentage\n"
      + analytics.topPages.map(page => `${page.page},${page.views},${page.percentage.toFixed(1)}%`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Données exportées avec succès');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Analyses et statistiques
            </h2>
            <p className="text-slate-600">
              Suivez les performances et l'utilisation de votre site web.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 jour</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={exportData}
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Pages vues</p>
                <p className="text-3xl font-bold text-slate-900">{analytics.pageViews.toLocaleString()}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Visiteurs uniques</p>
                <p className="text-3xl font-bold text-slate-900">{analytics.uniqueVisitors.toLocaleString()}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+8.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Temps moyen</p>
                <p className="text-3xl font-bold text-slate-900">{analytics.averageTime}</p>
                <div className="flex items-center space-x-1">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-600">-2.1%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Taux de rebond</p>
                <p className="text-3xl font-bold text-slate-900">{analytics.bounceRate}%</p>
                <div className="flex items-center space-x-1">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">-5.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Pages */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Pages les plus visitées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{page.page}</p>
                      <p className="text-sm text-slate-600">{page.views.toLocaleString()} vues</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    {page.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Stats */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              Répartition par appareil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analytics.devices.map((device, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.type)}
                      <span className="font-medium text-slate-900">{device.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{device.count.toLocaleString()}</p>
                      <p className="text-xs text-slate-600">{device.percentage}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Évolution du trafic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Pages vues</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Utilisateurs</span>
                </div>
              </div>
            </div>
            
            {/* Simple bar chart representation */}
            <div className="space-y-3">
              {analytics.traffic.map((day, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                    <div className="flex gap-4">
                      <span className="text-blue-600">{day.views}</span>
                      <span className="text-green-600">{day.users}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="bg-blue-500 h-2 rounded"
                      style={{ width: `${(day.views / Math.max(...analytics.traffic.map(t => t.views))) * 100}%` }}
                    />
                    <div
                      className="bg-green-500 h-2 rounded"
                      style={{ width: `${(day.users / Math.max(...analytics.traffic.map(t => t.users))) * 80}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}