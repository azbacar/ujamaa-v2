import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, TrendingUp, Briefcase, ArrowRight, Activity } from 'lucide-react';

interface RecentItem {
  id: string;
  title: string;
  type: 'event' | 'price' | 'tender' | 'freelance';
  date: string;
  meta?: string;
}

const TYPE_CONFIG = {
  event: { label: 'Événement', icon: Calendar, color: 'bg-blue-50 text-blue-700 border-blue-200', link: '/evenements' },
  price: { label: 'Prix', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', link: '/prix' },
  tender: { label: 'Appel d\'offres', icon: Briefcase, color: 'bg-amber-50 text-amber-700 border-amber-200', link: '/appels-offres' },
  freelance: { label: 'Mission', icon: Briefcase, color: 'bg-purple-50 text-purple-700 border-purple-200', link: '/freelance' },
};

const RecentContentSection = () => {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const [
        { data: events },
        { data: prices },
        { data: tenders },
        { data: jobs },
      ] = await Promise.all([
        supabase.from('events').select('id, title, created_at, island').eq('status', 'published').gte('date', new Date().toISOString()).order('created_at', { ascending: false }).limit(3),
        supabase.from('prices').select('id, product, created_at, island, price, currency').eq('status', 'published').order('created_at', { ascending: false }).limit(3),
        supabase.from('content_items').select('id, title, created_at').eq('type', 'tender').eq('status', 'published').order('created_at', { ascending: false }).limit(3),
        supabase.from('freelance_jobs').select('id, title, created_at, category').eq('status', 'published').order('created_at', { ascending: false }).limit(3),
      ]);

      const all: RecentItem[] = [];
      events?.forEach(e => all.push({ id: e.id, title: e.title, type: 'event', date: e.created_at!, meta: e.island }));
      prices?.forEach(p => all.push({ id: p.id, title: p.product, type: 'price', date: p.created_at, meta: `${p.price} ${p.currency}` }));
      tenders?.forEach(t => all.push({ id: t.id, title: t.title, type: 'tender', date: t.created_at }));
      jobs?.forEach(j => all.push({ id: j.id, title: j.title, type: 'freelance', date: j.created_at, meta: j.category }));

      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(all.slice(0, 8));
    };
    fetchRecent();
  }, []);

  if (items.length === 0) return null;

  const getLink = (item: RecentItem) => {
    if (item.type === 'event') return `/evenements/${item.id}`;
    if (item.type === 'tender') return `/appels-offres/${item.id}`;
    if (item.type === 'freelance') return `/freelance/${item.id}`;
    return '/prix';
  };

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1">
        {items.map((item) => {
          const config = TYPE_CONFIG[item.type];
          return (
            <Link
              key={`${item.type}-${item.id}`}
              to={getLink(item)}
              className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/60 transition-colors"
            >
              <Badge variant="outline" className={`${config.color} text-[9px] px-1.5 py-0.5 flex-shrink-0 mt-0.5`}>
                {config.label}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: fr })}
                  {item.meta && ` · ${item.meta}`}
                </p>
              </div>
              <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default RecentContentSection;
