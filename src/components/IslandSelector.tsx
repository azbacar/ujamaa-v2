import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/LanguageProvider';
import { Link } from 'react-router-dom';

interface Island {
  name: string;
  nameLocal: string;
  description: string;
  activeCount: number;
  image: string;
  gradient: string;
  slug: string;
}

const IslandSelector = () => {
  const { t } = useLanguage();

  const islands: Island[] = [
    {
      name: t('island.grandeComore') || 'Grande Comore',
      nameLocal: 'Ngazidja',
      description: 'La plus grande île de l\'archipel, abritant la capitale Moroni et le volcan Karthala.',
      activeCount: 245,
      image: 'https://images.unsplash.com/photo-1544966503-7fdb24ac2dca?auto=format&fit=crop&w=400&q=80',
      gradient: 'from-emerald-500 to-teal-600',
      slug: 'grande-comore'
    },
    {
      name: t('island.anjouan') || 'Anjouan',
      nameLocal: 'Ndzuwani',
      description: 'L\'île aux parfums, célèbre pour sa production d\'ylang-ylang et ses paysages montagneux.',
      activeCount: 186,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=400&q=80',
      gradient: 'from-blue-500 to-indigo-600',
      slug: 'anjouan'
    },
    {
      name: t('island.moheli') || 'Mohéli',
      nameLocal: 'Mwali',
      description: 'La plus petite île habitée, réputée pour son parc marin national et son écotourisme.',
      activeCount: 67,
      image: 'https://images.unsplash.com/photo-1571041804726-53fb982d8c81?auto=format&fit=crop&w=400&q=80',
      gradient: 'from-purple-500 to-pink-600',
      slug: 'moheli'
    },
    {
      name: t('island.mayotte') || 'Mayotte',
      nameLocal: 'Maore',
      description: 'L\'île au lagon, quatrième île des Comores avec un magnifique lagon turquoise.',
      activeCount: 198,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80',
      gradient: 'from-cyan-500 to-blue-600',
      slug: 'mayotte'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-white via-gray-50 to-blue-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            🏝️ Archipel des Comores
          </h2>
          <div className="flex justify-center mb-6">
            <Badge 
              variant="outline" 
              className="px-6 py-2 bg-white border-2 border-emerald-500 text-emerald-700 font-semibold text-lg shadow-lg"
            >
              4 Îles · Une Nation
            </Badge>
          </div>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium">
            Découvrez chaque île de notre archipel : leurs spécificités, prix locaux, 
            événements culturels et services disponibles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {islands.map((island, index) => (
            <Link key={index} to={`/ile/${island.slug}`}>
              <Card className="group bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 cursor-pointer overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    <img 
                      src={island.image} 
                      alt={island.name}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                    
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white text-gray-800 font-semibold shadow-md">
                        {island.activeCount} infos
                      </Badge>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-black text-2xl group-hover:text-emerald-300 transition-colors">
                          {island.name}
                        </h3>
                        <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-full">
                          {island.nameLocal}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-white">
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 group-hover:text-gray-900 transition-colors">
                      {island.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                        Explorer l'île
                      </span>
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                        <span className="text-white font-bold">→</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IslandSelector;