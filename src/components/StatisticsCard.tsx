
import { Card, CardContent } from '@/components/ui/card';

const StatisticsCard = () => {
  return (
    <Card className="glass-effect shadow-2xl">
      <CardContent className="p-8">
        <h3 className="font-bold text-2xl text-gray-900 mb-6 flex items-center gap-3">
          📊 Statistiques du jour
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
            <span className="text-base text-gray-700 font-medium">Nouvelles informations</span>
            <span className="font-bold text-2xl text-emerald-600">+34</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
            <span className="text-base text-gray-700 font-medium">Recherches effectuées</span>
            <span className="font-bold text-2xl text-ocean-600">1,247</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
            <span className="text-base text-gray-700 font-medium">Îles actives</span>
            <span className="font-bold text-2xl text-gold-600">4/4</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
