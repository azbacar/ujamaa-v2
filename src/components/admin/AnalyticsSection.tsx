import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BarChart3, Users, Eye, Clock, Globe, Smartphone, Monitor,
  TrendingUp, TrendingDown, Download, Calendar
} from 'lucide-react';

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  topPages: Array<{ page: string; views: number; percentage: number }>;
  dailyTraffic: Array<{ date: string; views: number; visitors: number }>;
  previousPageViews: number;
  previousVisitors: number;
}

export default function AnalyticsSection() {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pageViews: 0, uniqueVisitors: 0, topPages: [], dailyTraffic: [],
    previousPageViews: 0, previousVisitors: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getDateRange = () => {
    const now = new Date();
    const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    return { startDate, prevStartDate, days };
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { startDate, prevStartDate, days } = getDateRange();

      // Current period
      const { data: currentData } = await supabase
        .from('site_analytics')
        .select('page_path, session_id, created_at')
        .eq('event_type', 'page_view')
        .gte('created_at', startDate.toISOString());

      // Previous period for comparison
      const { count: prevCount } = await supabase
        .from('site_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const { data: prevSessions } = await supabase
        .from('site_analytics')
        .select('session_id')
        .eq('event_type', 'page_view')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const records = currentData || [];
      const pageViews = records.length;
      const uniqueVisitors = new Set(records.map(s => s.session_id).filter(Boolean)).size;
      const previousVisitors = new Set(prevSessions?.map(s => s.session_id).filter(Boolean)).size;

      // Top pages
      const pageCounts: Record<string, number> = {};
      records.forEach(r => {
        const p = r.page_path || '/';
        pageCounts[p] = (pageCounts[p] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .map(([page, views]) => ({ page, views, percentage: pageViews > 0 ? (views / pageViews) * 100 : 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8);

      // Daily traffic
      const dailyMap: Record<string, { views: number; sessions: Set<string> }> = {};
      records.forEach(r => {
        const day = r.created_at?.substring(0, 10) || '';
        if (!dailyMap[day]) dailyMap[day] = { views: 0, sessions: new Set() };
        dailyMap[day].views++;
        if (r.session_id) dailyMap[day].sessions.add(r.session_id);
      });
      const dailyTraffic = Object.entries(dailyMap)
        .map(([date, d]) => ({ date, views: d.views, visitors: d.sessions.size }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setAnalytics({
        pageViews,
        uniqueVisitors,
        topPages,
        dailyTraffic,
        previousPageViews: prevCount || 0,
        previousVisitors,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Erreur lors du chargement des analytics');
    } finally {
      setLoading(false);
    }
  };

  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const pvTrend = calcTrend(analytics.pageViews, analytics.previousPageViews);
  const uvTrend = calcTrend(analytics.uniqueVisitors, analytics.previousVisitors);

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Page,Vues,Pourcentage\n"
      + analytics.topPages.map(p => `${p.page},${p.views},${p.percentage.toFixed(1)}%`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Données exportées');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const TrendIndicator = ({ value }: { value: number }) => (
    <div className={`flex items-center space-x-1 ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span className="text-xs">{value >= 0 ? '+' : ''}{value.toFixed(1)}%</span>
    </div>
  );

  const maxViews = Math.max(...analytics.dailyTraffic.map(d => d.views), 1);

  return (
    <div className="p-8 space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Analyses et statistiques
            </h2>
            <p className="text-slate-600">Données réelles basées sur site_analytics</p>
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
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" /> Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Pages vues</p>
                <p className="text-3xl font-bold text-slate-900">{analytics.pageViews.toLocaleString()}</p>
                <TrendIndicator value={pvTrend} />
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Visiteurs uniques</p>
                <p className="text-3xl font-bold text-slate-900">{analytics.uniqueVisitors.toLocaleString()}</p>
                <TrendIndicator value={uvTrend} />
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
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
            {analytics.topPages.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucune donnée pour cette période</p>
            ) : (
              <div className="space-y-4">
                {analytics.topPages.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{page.page}</p>
                        <p className="text-xs text-slate-600">{page.views} vues</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      {page.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Traffic Chart */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Trafic journalier
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.dailyTraffic.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucune donnée pour cette période</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span>Pages vues</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span>Visiteurs</span></div>
                </div>
                {analytics.dailyTraffic.map((day, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 text-xs">
                        {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex gap-4 text-xs">
                        <span className="text-blue-600 font-medium">{day.views}</span>
                        <span className="text-green-600 font-medium">{day.visitors}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="bg-blue-500 h-2 rounded" style={{ width: `${(day.views / maxViews) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
