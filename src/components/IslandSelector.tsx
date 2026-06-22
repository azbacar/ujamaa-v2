import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';
import grandeComoreImg from '@/assets/island-grande-comore.jpg';
import moheliImg from '@/assets/island-moheli.jpg';

interface Island {
  name: string;
  nameLocal: string;
  image: string;
  slug: string;
}

const DEFAULT_IMAGES: Record<string, string> = {
  'grande-comore': grandeComoreImg,
  'anjouan': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=400&q=80',
  'moheli': moheliImg,
  'mayotte': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80',
};

const IslandSelector = () => {
  const { t } = useLanguage();
  const [customImages, setCustomImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase.from('site_settings_public').select('island_images').limit(1).maybeSingle();
      if (data?.island_images && typeof data.island_images === 'object') {
        setCustomImages(data.island_images as Record<string, string>);
      }
    };
    fetchImages();
  }, []);

  const getImage = (slug: string) => customImages[slug] || DEFAULT_IMAGES[slug];

  const islands: Island[] = [
    { name: t('island.grandeComore') || 'Grande Comore', nameLocal: 'Ngazidja', image: getImage('grande-comore'), slug: 'grande-comore' },
    { name: t('island.anjouan') || 'Anjouan', nameLocal: 'Ndzuwani', image: getImage('anjouan'), slug: 'anjouan' },
    { name: t('island.moheli') || 'Mohéli', nameLocal: 'Mwali', image: getImage('moheli'), slug: 'moheli' },
    { name: t('island.mayotte') || 'Mayotte', nameLocal: 'Maore', image: getImage('mayotte'), slug: 'mayotte' },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">🏝️ Nos îles</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {islands.map((island) => (
          <Link
            key={island.slug}
            to={`/ile/${island.slug}`}
            className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-muted"
          >
            <img
              src={island.image}
              alt={island.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{island.name}</h3>
              <p className="text-white/70 text-[10px] sm:text-xs">{island.nameLocal}</p>
            </div>
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default IslandSelector;
