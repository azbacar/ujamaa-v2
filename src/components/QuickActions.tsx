
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const QuickActions = () => {
  const urgentInfo = [
    {
      type: "ALERTE",
      title: "Avis de tempête - Grande Comore",
      time: "Il y a 2h",
      severity: "high",
      icon: "🚨"
    },
    {
      type: "APPEL D'OFFRES",
      title: "Rénovation infrastructure Anjouan",
      time: "Expire dans 5 jours",
      severity: "medium",
      icon: "📋"
    },
    {
      type: "ÉVÉNEMENT",
      title: "Festival culturel Mohéli",
      time: "Demain 14h",
      severity: "low",
      icon: "🎭"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300';
      case 'medium': return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300';
      default: return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
    }
  };

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
              onClick={() => window.location.href = '/annonces'}
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
          onClick={() => window.location.href = '/annonces'}
        >
          📢 Voir toutes les alertes
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
