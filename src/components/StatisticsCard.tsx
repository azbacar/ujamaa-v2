import { Card, CardContent } from '@/components/ui/card';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { Loader2 } from 'lucide-react';

const StatisticsCard = () => {
  const { userCount, contentCount, announcementsCount, eventsCount, upcomingEventsCount, loading } = useRealTimeStats();

  if (loading) {
    return (
      <Card className="glass-effect shadow-2xl">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect shadow-2xl">
      <CardContent className="p-8">
        <h3 className="font-bold text-2xl text-gray-900 mb-6 flex items-center gap-3">
          📊 Statistiques en temps réel
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
            <span className="text-base text-gray-700 font-medium">Utilisateurs inscrits</span>
            <span className="font-bold text-2xl text-emerald-600">{userCount}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
            <span className="text-base text-gray-700 font-medium">Contenus publiés</span>
            <span className="font-bold text-2xl text-ocean-600">{contentCount}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
            <span className="text-base text-gray-700 font-medium">Annonces actives</span>
            <span className="font-bold text-2xl text-magenta-600">{announcementsCount}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
            <span className="text-base text-gray-700 font-medium">Événements publiés</span>
            <span className="font-bold text-2xl text-purple-600">{eventsCount}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
            <span className="text-base text-gray-700 font-medium">Événements à venir</span>
            <span className="font-bold text-2xl text-blue-600">{upcomingEventsCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
