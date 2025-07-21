
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/LanguageProvider';

interface Island {
  name: string;
  nameLocal: string;
  description: string;
  activeCount: number;
  image: string;
  gradient: string;
}

const IslandSelector = () => {
  const { t } = useLanguage();
  const islands: Island[] = [
    {
      name: t('island.grandeComore'),
      nameLocal: "Ngazidja",
      description: "Capitale Moroni, volcans actifs",
      activeCount: 95,
      image: "🏔️",
      gradient: "from-red-400 to-orange-500"
    },
    {
      name: t('island.anjouan'),
      nameLocal: "Ndzuwani",
      description: "L'île aux parfums",
      activeCount: 47,
      image: "🌺",
      gradient: "from-pink-400 to-rose-500"
    },
    {
      name: t('island.moheli'),
      nameLocal: "Mwali",
      description: "Réserve marine nationale",
      activeCount: 18,
      image: "🐢",
      gradient: "from-emerald-400 to-teal-500"
    },
    {
      name: "Mayotte",
      nameLocal: "Maore",
      description: "L'île au lagon",
      activeCount: 32,
      image: "🏝️",
      gradient: "from-blue-400 to-cyan-500"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Informations par île</h2>
          <p className="text-gray-600">Découvrez les données spécifiques à chaque île</p>
        </div>
        <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 px-4 py-2 text-base font-semibold">
          🏝️ 4 îles disponibles
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {islands.map((island, index) => (
          <Card key={index} className="feature-card card-hover group overflow-hidden">
            <CardContent className="p-6 text-center space-y-4">
              <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${island.gradient} flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {island.image}
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-emerald-700 transition-colors">
                  {island.name}
                </h3>
                <p className="text-emerald-600 font-semibold text-base">
                  {island.nameLocal}
                </p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {island.description}
              </p>
              <Badge variant="secondary" className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-medium px-3 py-1">
                📊 {island.activeCount} informations
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IslandSelector;
