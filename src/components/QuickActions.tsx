
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const QuickActions = () => {
  const urgentInfo = [
    {
      type: "ALERTE",
      title: "Avis de tempête - Grande Comore",
      time: "Il y a 2h",
      severity: "high"
    },
    {
      type: "APPEL D'OFFRES",
      title: "Rénovation infrastructure Anjouan",
      time: "Expire dans 5 jours",
      severity: "medium"
    },
    {
      type: "ÉVÉNEMENT",
      title: "Festival culturel Mohéli",
      time: "Demain 14h",
      severity: "low"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <Card className="glass-effect">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Informations urgentes</h2>
          <Badge variant="destructive" className="animate-pulse">
            {urgentInfo.length} alertes
          </Badge>
        </div>
        
        <div className="space-y-3">
          {urgentInfo.map((info, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors cursor-pointer">
              <Badge variant="outline" className={getSeverityColor(info.severity)}>
                {info.type}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{info.title}</p>
                <p className="text-xs text-gray-500">{info.time}</p>
              </div>
            </div>
          ))}
        </div>
        
        <Button variant="outline" className="w-full mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          Voir toutes les alertes
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
