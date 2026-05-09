import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Calendar, Briefcase, Globe, ShoppingCart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface StatItem {
  label: string;
  count: number;
  icon: React.ReactNode;
  link: string;
  gradient: string;
}

const fetchLiveStats = async (): Promise<StatItem[]> => {
  const [
    { count: pricesCount },
    { count: eventsCount },
    { count: tendersCount },
    { count: freelanceCount },
    { count: diasporaCount },
  ] = await Promise.all([
    supabase.from('prices').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('date', new Date().toISOString()),
    supabase.from('content_items').select('*', { count: 'exact', head: true }).eq('type', 'tender').eq('status', 'published'),
    supabase.from('freelance_jobs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('investments').select('*', { count: 'exact', head: true }).eq('status', 'published'),
  ]);

  return [
    { label: 'Prix', count: pricesCount || 0, icon: <ShoppingCart className="w-4 h-4" />, link: '/prix', gradient: 'from-emerald-500/10 to-emerald-500/5' },
    { label: 'Événements', count: eventsCount || 0, icon: <Calendar className="w-4 h-4" />, link: '/evenements', gradient: 'from-ocean-500/10 to-ocean-500/5' },
    { label: 'Appels d\'offres', count: tendersCount || 0, icon: <Briefcase className="w-4 h-4" />, link: '/appels-offres', gradient: 'from-amber-500/10 to-amber-500/5' },
    { label: 'Missions', count: freelanceCount || 0, icon: <TrendingUp className="w-4 h-4" />, link: '/freelance', gradient: 'from-purple-500/10 to-purple-500/5' },
    { label: 'Projets', count: diasporaCount || 0, icon: <Globe className="w-4 h-4" />, link: '/investissement', gradient: 'from-blue-500/10 to-blue-500/5' },
  ];
};

const LiveStatsBar = () => {
  const { data: stats = [] } = useQuery({
    queryKey: ['live-stats'],
    queryFn: fetchLiveStats,
    staleTime: 5 * 60 * 1000,
  });

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          to={stat.link}
          className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${stat.gradient} px-3 py-3 sm:px-4 sm:py-4 hover:shadow-lg hover:border-primary/30 transition-all duration-300 text-center`}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div className="text-primary opacity-60 group-hover:opacity-100 transition-opacity group-hover:scale-110 transform duration-200">
              {stat.icon}
            </div>
            <p className="text-lg sm:text-2xl font-bold text-foreground leading-none tabular-nums">{stat.count}</p>
            <p className="text-[9px] sm:text-xs text-muted-foreground font-medium">{stat.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default LiveStatsBar;
