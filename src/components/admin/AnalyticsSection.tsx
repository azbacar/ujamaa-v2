import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pageViews: 45238,
    uniqueVisitors: 12456,
    averageTime: '2m 34s',
    bounceRate: 34.2,
    topPages: [
      { page: '/prix', views: 8945, percentage: 19.8 },
      { page: '/', views: 7234, percentage: 16.0 },
      { page: '/appels-offres', views: 5432, percentage: 12.0 },
      { page: '/evenements', views: 4123, percentage: 9.1 },
      { page: '/services', views: 3456, percentage: 7.6 }
    ],
    devices: [
      { type: 'Mobile', count: 28456, percentage: 62.9 },
      { type: 'Desktop', count: 12345, percentage: 27.3 },
      { type: 'Tablet', count: 4437, percentage: 9.8 }
    ],
    traffic: [
      { date: '2024-01-01', views: 1234, users: 567 },
      { date: '2024-01-02', views: 1456, users: 623 },
      { date: '2024-01-03', views: 1789, users: 734 },
      { date: '2024-01-04', views: 1567, users: 656 },
      { date: '2024-01-05', views: 1890, users: 789 },
      { date: '2024-01-06', views: 2103, users: 834 },
      { date: '2024-01-07', views: 1945, users: 723 }
    ]
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'Mobile': return <Smartphone className="h-4 w-4" />;
      case 'Desktop': return <Monitor className="h-4 w-4" />;
      case 'Tablet': return <Smartphone className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const exportData = () => {
    // Simulate data export
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Page,Vues,Pourcentage\n"
      + analytics.topPages.map(page => `${page.page},${page.views},${page.percentage}%`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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