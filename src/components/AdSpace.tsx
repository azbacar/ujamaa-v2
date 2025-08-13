import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface AdSpaceProps {
  size?: 'small' | 'medium' | 'large' | 'banner';
  position?: 'sidebar' | 'content' | 'header' | 'footer';
  className?: string;
}

// Configuration des espaces publicitaires
const adConfigs = {
  small: { width: '300px', height: '200px' },
  medium: { width: '400px', height: '300px' },
  large: { width: '600px', height: '400px' },
  banner: { width: '100%', height: '120px' }
};

const AdSpace = ({ size = 'medium', position = 'content', className = '' }: AdSpaceProps) => {
  // En production, ceci serait géré par l'admin via une base de données
  const mockAds = [
    {
      id: 1,
      title: "Banque Centrale des Comores",
      image: "https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=400&q=80",
      link: "https://banque-comores.km",
      description: "Services bancaires pour tous"
    },
    {
      id: 2,
      title: "Air Comores", 
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80",
      link: "https://aircomores.km",
      description: "Vols inter-îles quotidiens"
    },
    {
      id: 3,
      title: "Hôtel Moroni Prince",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80",
      link: "https://hotel-moroni.km", 
      description: "Séjour de luxe à Moroni"
    }
  ];

  // Sélection aléatoire d'une publicité
  const currentAd = mockAds[Math.floor(Math.random() * mockAds.length)];
  const config = adConfigs[size];

  if (size === 'banner') {
    return (
      <Card className={`ad-space overflow-hidden hover:shadow-lg transition-shadow duration-300 w-full ${className}`}>
        <CardContent className="p-4 relative group">
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 z-10 bg-white/90 text-gray-600 text-xs"
          >
            Publicité
          </Badge>
          
          <a 
            href={currentAd.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden">
              <img 
                src={currentAd.image} 
                alt={currentAd.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{currentAd.title}</h3>
              <p className="text-sm text-gray-600">{currentAd.description}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-emerald-600" />
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`ad-space overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`} 
          style={{ maxWidth: config.width }}>
      <CardContent className="p-0 relative group">
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 z-10 bg-white/90 text-gray-600 text-xs"
        >
          Publicité
        </Badge>
        
        <a 
          href={currentAd.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative" style={{ height: config.height }}>
            <img 
              src={currentAd.image} 
              alt={currentAd.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-bold text-lg mb-1 line-clamp-1">{currentAd.title}</h3>
              <p className="text-sm text-white/90 line-clamp-2">{currentAd.description}</p>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-white/80">Cliquez pour en savoir plus</span>
                <ExternalLink className="w-4 h-4 text-white/80" />
              </div>
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  );
};

export default AdSpace;