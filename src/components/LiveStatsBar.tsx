import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Calendar, Briefcase, Globe, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatItem {
  label: string;
  count: number;
  icon: React.ReactNode;
  link: string;
}

const LiveStatsBar = () => {
  const [stats, setStats] = useState<StatItem[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: pricesCount },
        { count: eventsCount },
        { count: tendersCount },
        { count: freelanceCount },
        { count: diasporaCount },
      ] = await Promise.all([
        supabase.from('prices').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('content_items').select('*', { count: 'exact', head: true }).eq('type', 'tender').eq('status', 'published'),
        supabase.from('freelance_jobs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('diaspora_projects').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      ]);

      setStats([
        { label: 'Prix', count: pricesCount || 0, icon: <ShoppingCart className="w-4 h-4" />, link: '/prix' },
        { label: 'Événements', count: eventsCount || 0, icon: <Calendar className="w-4 h-4" />, link: '/evenements' },
        { label: 'Appels d\'offres', count: tendersCount || 0, icon: <Briefcase className="w-4 h-4" />, link: '/appels-offres' },
        { label: 'Missions', count: freelanceCount || 0, icon: <TrendingUp className="w-4 h-4" />, link: '/freelance' },
        { label: 'Projets', count: diasporaCount || 0, icon: <Globe className="w-4 h-4" />, link: '/investissement' },
      ]);
    };
    fetchStats();
  }, []);

  if (stats.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          to={stat.link}
          className="group flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 sm:px-4 sm:py-3 hover:shadow-md hover:border-primary/20 transition-all flex-shrink-0 min-w-0"
        >
          <div className="text-primary opacity-70 group-hover:opacity-100 transition-opacity">
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-foreground leading-none tabular-nums">{stat.count}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{stat.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default LiveStatsBar;
