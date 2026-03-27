import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell } from 'lucide-react';

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
          const timeStr = diffHours < 24 ? `Dans ${diffHours}h` : `Dans ${Math.round(diffHours / 24)}j`;
          items.push({
            type: 'ÉVÉNEMENT',
            title: e.title,
            time: timeStr,
            severity: 'low',
            icon: '📅',
            link: `/evenements/${e.id}`
          });
        });
      }

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
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-primary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (urgentInfo.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Alertes & événements
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-xs text-muted-foreground text-center py-4">✅ Aucune alerte en cours</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Alertes & événements
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive">
            {urgentInfo.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1">
        {urgentInfo.map((info, index) => (
          <div
            key={index}
            className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
            onClick={() => navigate(info.link)}
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getSeverityDot(info.severity)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {info.title}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {info.type} · {info.time}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
