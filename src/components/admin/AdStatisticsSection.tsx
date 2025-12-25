import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Eye, MousePointerClick, TrendingUp, BarChart3 } from 'lucide-react';

interface AdStats {
  id: string;
  title: string;
  position: string;
  size: string;
  impression_count: number;
  click_count: number;
  ctr: number;
}

interface DailyStats {
  date: string;
  impressions: number;
  clicks: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const AdStatisticsSection = () => {
  const [ads, setAds] = useState<AdStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch ads with their stats
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select('id, title, position, size, impression_count, click_count')
        .eq('is_active', true);

      if (adsError) throw adsError;

      const adsWithCtr = (adsData || []).map((ad) => ({
        ...ad,
        ctr: ad.impression_count > 0 ? (ad.click_count / ad.impression_count) * 100 : 0,
      }));

      setAds(adsWithCtr);

      // Fetch daily analytics
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      const { data: analyticsData, error: analyticsError } = await supabase
        .from('site_analytics')
        .select('event_type, created_at, metadata')
        .in('event_type', ['ad_impression', 'ad_click'])
        .gte('created_at', daysAgo.toISOString());

      if (analyticsError) throw analyticsError;

      // Group by date
      const dailyMap: Record<string, { impressions: number; clicks: number }> = {};

      (analyticsData || []).forEach((event) => {
        const date = new Date(event.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
        });

        if (!dailyMap[date]) {
          dailyMap[date] = { impressions: 0, clicks: 0 };
        }

        if (event.event_type === 'ad_impression') {
          dailyMap[date].impressions++;
        } else if (event.event_type === 'ad_click') {
          dailyMap[date].clicks++;
        }
      });

      const sortedDaily = Object.entries(dailyMap)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => {
          const [dayA, monthA] = a.date.split('/').map(Number);
          const [dayB, monthB] = b.date.split('/').map(Number);
          return monthA - monthB || dayA - dayB;
        });

      setDailyStats(sortedDaily);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impression_count, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.click_count, 0);
  const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Position distribution data
  const positionData = ads.reduce<Record<string, number>>((acc, ad) => {
    acc[ad.position] = (acc[ad.position] || 0) + ad.impression_count;
    return acc;
  }, {});

  const positionChartData = Object.entries(positionData).map(([name, value]) => ({
    name,
    value,
  }));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">📊 Statistiques Publicitaires</h2>
          <p className="text-slate-600">Analysez les performances de vos publicités</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="14">14 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Eye className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Impressions</p>
                <p className="text-2xl font-bold text-slate-900">{totalImpressions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MousePointerClick className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Clics</p>
                <p className="text-2xl font-bold text-slate-900">{totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">CTR Moyen</p>
                <p className="text-2xl font-bold text-slate-900">{averageCtr.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Publicités Actives</p>
                <p className="text-2xl font-bold text-slate-900">{ads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Quotidienne</CardTitle>
            <CardDescription>Impressions et clics par jour</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="#10b981" name="Impressions" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="#3b82f6" name="Clics" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Position Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution par Position</CardTitle>
            <CardDescription>Impressions par emplacement publicitaire</CardDescription>
          </CardHeader>
          <CardContent>
            {positionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={positionChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {positionChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ads Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Publicité</CardTitle>
          <CardDescription>Détails des performances de chaque publicité</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Titre</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Position</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Taille</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Impressions</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Clics</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">CTR</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{ad.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{ad.position}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{ad.size}</span>
                    </td>
                    <td className="py-3 px-4 text-right">{ad.impression_count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{ad.click_count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-medium ${ad.ctr > 2 ? 'text-green-600' : ad.ctr > 1 ? 'text-yellow-600' : 'text-slate-600'}`}>
                        {ad.ctr.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {ads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Aucune publicité active
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdStatisticsSection;
