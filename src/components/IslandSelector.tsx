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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold gradient-text mb-4">
            🏝️ Informations par Île
          </h2>
          <Badge variant="outline" className="mb-6 bg-white/50 border-emerald-300 text-emerald-700">
            Archipel des Comores - 4 îles
          </Badge>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explorez chaque île de l'archipel des Comores et découvrez leurs spécificités, 
            prix locaux, événements et services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {islands.map((island, index) => (
            <Link key={index} to={`/ile/${island.slug}`}>
              <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer animate-fade-in">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <div className={`absolute inset-0 bg-gradient-to-br ${island.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
                    <img 
                      src={island.image} 
                      alt={island.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/90 text-gray-800 hover:bg-white">
                        {island.activeCount} infos
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {island.name}
                      </h3>
                      <span className="text-sm text-gray-500 font-medium">
                        {island.nameLocal}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors">
                      {island.description}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Cliquez pour explorer</span>
                        <span className="text-emerald-600 group-hover:text-emerald-700 transition-colors">→</span>
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