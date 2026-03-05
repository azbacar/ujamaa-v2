import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  contentType: string;
  contentId: string;
  size?: 'sm' | 'default';
  className?: string;
}

export default function FavoriteButton({ contentType, contentId, size = 'default', className }: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) checkFavorite();
  }, [user, contentId]);

  const checkFavorite = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle();
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      return;
    }
    setLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId);
        setIsFavorite(false);
        toast.success('Retiré des favoris');
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, content_type: contentType, content_id: contentId });
        setIsFavorite(true);
        toast.success('Ajouté aux favoris');
      }
    } catch {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size={size === 'sm' ? 'icon' : 'default'}
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(className)}
    >
      <Heart className={cn('h-4 w-4', isFavorite && 'fill-red-500 text-red-500')} />
      {size !== 'sm' && <span className="ml-2">{isFavorite ? 'Favori' : 'Sauvegarder'}</span>}
    </Button>
  );
}
