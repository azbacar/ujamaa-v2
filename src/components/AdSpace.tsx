import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdSpaceProps {
  size?: 'small' | 'medium' | 'large' | 'banner' | 'inline';
  position?: 'sidebar' | 'content' | 'header' | 'footer';
  className?: string;
  lazy?: boolean;
}

const adConfigs = {
  small: { width: '280px', height: '180px' },
  medium: { width: '100%', maxWidth: '400px', height: '280px' },
  large: { width: '100%', maxWidth: '600px', height: '350px' },
  banner: { width: '100%', height: '100px' },
  inline: { width: '100%', height: '90px' },
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

const AdSpace = ({ size = 'medium', position = 'content', className = '', lazy = true }: AdSpaceProps) => {
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(!lazy);
  const ref = useRef<HTMLDivElement>(null);
  
  // Lazy loading with IntersectionObserver
  useEffect(() => {
    if (!lazy || !ref.current) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [lazy]);

  useEffect(() => {
    if (!isVisible) return;

    const fetchAd = async () => {
      try {
        const now = new Date().toISOString();
        // Map 'inline' size to 'banner' for DB query (reuse banner ads for inline)
        const dbSize = size === 'inline' ? 'banner' : size;
        const { data: ads, error } = await supabase
          .from('ads')
          .select('*')
          .eq('position', position)
          .eq('size', dbSize)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching ads:', error);
          return;
        }

        if (ads && ads.length > 0) {
          const validAds = ads.filter(ad => {
            const startValid = !ad.start_date || new Date(ad.start_date) <= new Date(now);
            const endValid = !ad.end_date || new Date(ad.end_date) >= new Date(now);
            return startValid && endValid;
          });

          if (validAds.length > 0) {
            const randomAd = validAds[Math.floor(Math.random() * validAds.length)];
            setCurrentAd(randomAd);
            
            await supabase
              .from('site_analytics')
              .insert([{
                event_type: 'ad_impression',
                metadata: { ad_id: randomAd.id, position, size }
              }]);
            
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
  }, [position, size, isVisible]);

  const handleClick = async () => {
    if (currentAd) {
      await supabase
        .from('site_analytics')
        .insert([{
          event_type: 'ad_click',
          metadata: { ad_id: currentAd.id, position, size }
        }]);
      
      await supabase
        .from('ads')
        .update({ click_count: (currentAd.click_count || 0) + 1 })
        .eq('id', currentAd.id);
    }
  };

  // Placeholder for lazy loading
  if (!isVisible) {
    return <div ref={ref} className={`min-h-[80px] ${className}`} />;
  }

  if (loading) {
    return (
      <div ref={ref} className={`ad-space ${className}`}>
        <div className="animate-pulse bg-muted rounded-lg" style={{ height: adConfigs[size]?.height || '80px' }} />
      </div>
    );
  }

  if (!currentAd) return null;

  const config = adConfigs[size];

  // Inline ad: compact horizontal strip for between list items
  if (size === 'inline') {
    return (
      <Card ref={ref as any} className={`ad-space overflow-hidden border-dashed border-muted-foreground/20 bg-muted/30 hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-3 relative">
          <Badge 
            variant="secondary" 
            className="absolute top-1 right-1 z-10 bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5"
          >
            Pub
          </Badge>
          <a 
            href={currentAd.link_url || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleClick}
            className="flex items-center gap-3 group"
          >
            {currentAd.image_url && (
              <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden">
                <img 
                  src={currentAd.image_url} 
                  alt={currentAd.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground truncate">{currentAd.title}</h4>
              {currentAd.description && (
                <p className="text-xs text-muted-foreground truncate">{currentAd.description}</p>
              )}
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
          </a>
        </CardContent>
      </Card>
    );
  }

  // Banner ad
  if (size === 'banner') {
    return (
      <Card ref={ref as any} className={`ad-space overflow-hidden hover:shadow-lg transition-shadow duration-300 w-full ${className}`}>
        <CardContent className="p-3 sm:p-4 relative group">
          <Badge 
            variant="secondary" 
            className="absolute top-1.5 right-1.5 z-10 bg-background/90 text-muted-foreground text-[10px]"
          >
            Publicité
          </Badge>
          
          <a 
            href={currentAd.link_url || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleClick}
            className="flex items-center gap-3 sm:gap-4 group"
          >
            <div className="w-16 h-12 sm:w-24 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden">
              <img 
                src={currentAd.image_url || 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=400&q=80'} 
                alt={currentAd.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-lg text-foreground mb-0.5 truncate">{currentAd.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{currentAd.description}</p>
            </div>
            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
          </a>
        </CardContent>
      </Card>
    );
  }

  // Standard card ad (small, medium, large)
  return (
    <Card 
      ref={ref as any}
      className={`ad-space overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`} 
      style={{ maxWidth: (config as any).maxWidth || config.width, width: '100%' }}
    >
      <CardContent className="p-0 relative group">
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 z-10 bg-background/90 text-muted-foreground text-[10px]"
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
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
              <h3 className="font-bold text-base sm:text-lg mb-0.5 line-clamp-1">{currentAd.title}</h3>
              <p className="text-xs sm:text-sm text-white/90 line-clamp-2">{currentAd.description}</p>
              
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] sm:text-xs text-white/80">Cliquez pour en savoir plus</span>
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80" />
              </div>
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  );
};

export default AdSpace;
