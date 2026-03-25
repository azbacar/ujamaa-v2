
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Calendar, Briefcase, Globe, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatItem {
  label: string;
  count: number;
  icon: React.ReactNode;
  link: string;
  color: string;
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
        { label: 'Prix', count: pricesCount || 0, icon: <ShoppingCart className="w-4 h-4" />, link: '/prix', color: 'text-emerald-600' },
        { label: 'Événements', count: eventsCount || 0, icon: <Calendar className="w-4 h-4" />, link: '/evenements', color: 'text-blue-600' },
        { label: 'Appels d\'offres', count: tendersCount || 0, icon: <Briefcase className="w-4 h-4" />, link: '/appels-offres', color: 'text-amber-600' },
        { label: 'Missions', count: freelanceCount || 0, icon: <TrendingUp className="w-4 h-4" />, link: '/freelance', color: 'text-purple-600' },
        { label: 'Projets', count: diasporaCount || 0, icon: <Globe className="w-4 h-4" />, link: '/investissement', color: 'text-rose-600' },
      ]);
    };
    fetchStats();
  }, []);

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          to={stat.link}
          className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 hover:shadow-md hover:border-primary/30 transition-all"
        >
          <div className={`${stat.color} bg-current/10 p-2 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-bold text-foreground leading-none">{stat.count}</p>
            <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default LiveStatsBar;
