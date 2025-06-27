
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Island {
  name: string;
  nameLocal: string;
  description: string;
  activeCount: number;
  image: string;
}

const IslandSelector = () => {
  const islands: Island[] = [
    {
      name: "Grande Comore",
      nameLocal: "Ngazidja",
      description: "Capitale Moroni, volcans actifs",
      activeCount: 142,
      image: "🏔️"
    },
    {
      name: "Anjouan",
      nameLocal: "Ndzuwani",
      description: "L'île aux parfums",
      activeCount: 89,
      image: "🌺"
    },
    {
      name: "Mohéli",
      nameLocal: "Mwali",
      description: "Réserve marine nationale",
      activeCount: 34,
      image: "🐢"
    },
    {
      name: "Mayotte",
      nameLocal: "Maore",
      description: "Département français",
      activeCount: 67,
      image: "🏝️"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Informations par île</h2>
        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
          4 îles disponibles
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {islands.map((island, index) => (
          <Card key={index} className="card-hover cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <div className="text-3xl mb-2">{island.image}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{island.name}</h3>
                  <p className="text-sm text-emerald-600 font-medium">{island.nameLocal}</p>
                </div>
                <p className="text-xs text-gray-600">{island.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {island.activeCount} informations actives
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IslandSelector;
