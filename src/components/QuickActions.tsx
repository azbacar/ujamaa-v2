
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface UrgentItem {
  type: string;
  title: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
  icon: string;
  link: string;
}

const QuickActions = () => {
  const [urgentInfo, setUrgentInfo] = useState<UrgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUrgentInfo();
  }, []);

  const fetchUrgentInfo = async () => {
    try {
      const items: UrgentItem[] = [];

      // Fetch urgent/warning global announcements
      const { data: announcements } = await supabase
        .from('global_announcements')
        .select('*')
        .in('type', ['urgent', 'warning'])
        .order('created_at', { ascending: false })
        .limit(3);

      if (announcements) {
        announcements.forEach(a => {
          items.push({
            type: a.type === 'urgent' ? 'ALERTE' : 'AVIS',
            title: a.title,
            time: getRelativeTime(a.created_at),
            severity: a.type === 'urgent' ? 'high' : 'medium',
            icon: a.type === 'urgent' ? '🚨' : '⚠️',
            link: '/annonces'
          });
        });
      }

      // Fetch upcoming events (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const { data: events } = await supabase
        .from('events')
        .select('id, title, date')
        .eq('status', 'published')
        .gte('date', now.toISOString())
        .lte('date', nextWeek.toISOString())
        .order('date', { ascending: true })
        .limit(3);

      if (events) {
        events.forEach(e => {
          const eventDate = new Date(e.date);
          const diffHours = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));
          const timeStr = diffHours < 24 
            ? `Dans ${diffHours}h` 
            : `Dans ${Math.round(diffHours / 24)} jour(s)`;
          items.push({
            type: 'ÉVÉNEMENT',
            title: e.title,
            time: timeStr,
            severity: 'low',
            icon: '🎭',
            link: `/evenements/${e.id}`
          });
        });
      }

      // Fetch recent content items (tenders with deadline)
      const { data: tenders } = await supabase
        .from('content_items')
        .select('id, title, created_at')
        .eq('type', 'tender')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(2);

      if (tenders) {
        tenders.forEach(t => {
          items.push({
            type: "APPEL D'OFFRES",
            title: t.title,
            time: getRelativeTime(t.created_at),
            severity: 'medium',
            icon: '📋',
            link: '/appels-offres'
          });
        });
      }

      // If no real data, show a helpful empty state
      setUrgentInfo(items.slice(0, 5));
    } catch (error) {
      console.error('Error fetching urgent info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "À l'instant";
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour(s)`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
      case 'medium': return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300';
      default: return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
    }
  };

  if (loading) {
    return (
      <Card className="glass-effect shadow-2xl">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (urgentInfo.length === 0) {
    return (
      <Card className="glass-effect shadow-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Informations urgentes</h2>
              <p className="text-gray-600">Restez informé en temps réel</p>
            </div>
          </div>
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-lg">✅ Aucune alerte en cours</p>
            <p className="text-sm mt-1">Tout est calme pour le moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect shadow-2xl">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Informations urgentes</h2>
            <p className="text-gray-600">Restez informé en temps réel</p>
          </div>
          <Badge variant="destructive" className="animate-pulse bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 text-base font-bold shadow-lg">
            🔔 {urgentInfo.length} alertes
          </Badge>
        </div>
        
        <div className="space-y-4">
           {urgentInfo.map((info, index) => (
            <div 
              key={index} 
              className="group flex items-start gap-4 p-4 rounded-xl bg-white/60 hover:bg-white/90 transition-all duration-300 cursor-pointer border border-white/30 hover:shadow-lg"
              onClick={() => navigate(info.link)}
            >
              <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                {info.icon}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className={`${getSeverityColor(info.severity)} font-semibold text-xs px-3 py-1`}>
                    {info.type}
                  </Badge>
                </div>
                <p className="font-semibold text-base text-gray-900 group-hover:text-emerald-700 transition-colors">
                  {info.title}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <span>⏰</span> {info.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-6 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold py-3 text-base rounded-xl shadow-sm"
          onClick={() => navigate('/annonces')}
        >
          📢 Voir toutes les alertes
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
