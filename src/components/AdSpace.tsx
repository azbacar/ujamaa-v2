import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  position: string;
  size: string;
  click_count: number;
  impression_count: number;
}

const AdSpace = ({ size = 'medium', position = 'content', className = '' }: AdSpaceProps) => {
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAd = async () => {
      try {
        // Fetch ads that match position and size, and are currently active
        const now = new Date().toISOString();
        const { data: ads, error } = await supabase
          .from('ads')
          .select('*')
          .eq('position', position)
          .eq('size', size)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching ads:', error);
          return;
        }

        if (ads && ads.length > 0) {
          // Filter ads by date on client side (more reliable than complex Supabase OR queries)
          const validAds = ads.filter(ad => {
            const startValid = !ad.start_date || new Date(ad.start_date) <= new Date(now);
            const endValid = !ad.end_date || new Date(ad.end_date) >= new Date(now);
            return startValid && endValid;
          });

          if (validAds.length > 0) {
            // Select random ad from matching ads
            const randomAd = validAds[Math.floor(Math.random() * validAds.length)];
            setCurrentAd(randomAd);
            
            // Track impression
            await supabase
              .from('site_analytics')
              .insert([{
                event_type: 'ad_impression',
                metadata: { 
                  ad_id: randomAd.id, 
                  position, 
                  size 
                }
              }]);
            
            // Increment impression count
            await supabase
              .from('ads')
              .update({ impression_count: (randomAd.impression_count || 0) + 1 })
              .eq('id', randomAd.id);
          }
        }
      } catch (error) {
        console.error('Error in fetchAd:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [position, size]);

  const handleClick = async () => {
    if (currentAd) {
      // Track click
      await supabase
        .from('site_analytics')
        .insert([{
          event_type: 'ad_click',
          metadata: { 
            ad_id: currentAd.id, 
            position, 
            size 
          }
        }]);
      
      // Increment click count
      await supabase
        .from('ads')
        .update({ click_count: (currentAd.click_count || 0) + 1 })
        .eq('id', currentAd.id);
    }
  };

  if (loading) {
    return (
      <Card className={`ad-space ${className}`}>
        <CardContent className="p-4 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  if (!currentAd) {
    return null; // Don't show anything if no ads available
  }

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
            href={currentAd.link_url || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleClick}
            className="flex items-center gap-4 group"
          >
            <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden">
              <img 
                src={currentAd.image_url || 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=400&q=80'} 
                alt={currentAd.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground mb-1">{currentAd.title}</h3>
              <p className="text-sm text-muted-foreground">{currentAd.description}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
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
          href={currentAd.link_url || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleClick}
          className="block"
        >
          <div className="relative" style={{ height: config.height }}>
            <img 
              src={currentAd.image_url || 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=400&q=80'} 
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