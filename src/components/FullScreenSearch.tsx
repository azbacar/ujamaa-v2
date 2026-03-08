import { useState, useEffect, useRef } from 'react';
import { X, Search, MessageCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'price' | 'event' | 'service' | 'announcement' | 'tender' | 'gastronomy' | 'alert';
  title: string;
  description: string;
  url: string;
  category?: string;
}

interface FullScreenSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const FullScreenSearch = ({ isOpen, onClose }: FullScreenSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchErrors, setSearchErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const normalized = searchTerm.trim();

    if (!normalized) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const sanitizeForPostgrestOr = (value: string) =>
      value
        .toLowerCase()
        .replace(/[,*()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const query = sanitizeForPostgrestOr(normalized);

    if (!query) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);

      try {
        const pattern = `*${query}*`;

        const [eventsRes, contentRes, pricesRes, gastronomyRes, alertsRes] = await Promise.all([
          supabase
            .from('events')
            .select('id, title, description, category')
            .eq('status', 'published')
            .or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)
            .limit(5),
          supabase
            .from('content_items')
            .select('id, title, description, type, category')
            .eq('status', 'published')
            .or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)
            .limit(10),
          supabase
            .from('prices')
            .select('id, product, category, market, island')
            .eq('status', 'published')
            .or(`product.ilike.${pattern},category.ilike.${pattern},market.ilike.${pattern}`)
            .limit(5),
          supabase
            .from('gastronomy_items')
            .select('id, title, description, category, type')
            .eq('status', 'published')
            .or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`)
            .limit(5),
          supabase
            .from('global_announcements')
            .select('id, title, content, type')
            .or(`title.ilike.${pattern},content.ilike.${pattern}`)
            .limit(5),
        ]);

        const errors = [
          ['events', eventsRes.error],
          ['content_items', contentRes.error],
          ['prices', pricesRes.error],
          ['gastronomy_items', gastronomyRes.error],
          ['global_announcements', alertsRes.error],
        ].filter(([, error]) => Boolean(error));

        if (errors.length > 0) {
          console.error('Erreurs partielles de recherche:', errors);
        }

        const searchResults: SearchResult[] = [];

        eventsRes.data?.forEach((e) => {
          searchResults.push({ id: e.id, type: 'event', title: e.title, description: e.description || '', url: `/evenements/${e.id}`, category: e.category });
        });

        contentRes.data?.forEach((c) => {
          const typeMap: Record<string, { type: SearchResult['type']; url: string }> = {
            announcement: { type: 'announcement', url: `/annonces/${c.id}` },
            service: { type: 'service', url: `/services/${c.id}` },
            tender: { type: 'tender', url: `/appels-offres/${c.id}` },
          };
          const mapped = typeMap[c.type] || { type: 'announcement', url: `/annonces/${c.id}` };
          searchResults.push({ id: c.id, type: mapped.type, title: c.title, description: c.description || '', url: mapped.url, category: c.category || undefined });
        });

        pricesRes.data?.forEach((p) => {
          searchResults.push({ id: p.id, type: 'price', title: p.product, description: `${p.market} - ${p.island}`, url: '/prix', category: p.category });
        });

        gastronomyRes.data?.forEach((g) => {
          searchResults.push({ id: g.id, type: 'gastronomy' as SearchResult['type'], title: g.title, description: g.description || '', url: `/gastronomie/${g.id}`, category: g.category || undefined });
        });

        alertsRes.data?.forEach((a) => {
          searchResults.push({ id: a.id, type: 'alert' as SearchResult['type'], title: a.title, description: a.content || '', url: '/', category: a.type });
        });

        setResults(searchResults);
      } catch (error) {
        console.error('Erreur de recherche:', error);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const getTypeIcon = (type: SearchResult['type']) => {
    const icons: Record<string, string> = {
      price: '💰', event: '🎭', service: '🏛️', announcement: '📢',
      tender: '📋', gastronomy: '🍽️', alert: '🚨',
    };
    return icons[type] || '📄';
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    const labels: Record<string, string> = {
      price: 'Prix', event: 'Événement', service: 'Service',
      announcement: 'Annonce', tender: 'Appel d\'offres',
      gastronomy: 'Gastronomie', alert: 'Alerte',
    };
    return labels[type] || 'Autre';
  };

  const getTypeColor = (type: SearchResult['type']) => {
    const colors: Record<string, string> = {
      price: 'bg-green-100 text-green-700', event: 'bg-purple-100 text-purple-700',
      service: 'bg-blue-100 text-blue-700', announcement: 'bg-orange-100 text-orange-700',
      tender: 'bg-yellow-100 text-yellow-700', gastronomy: 'bg-pink-100 text-pink-700',
      alert: 'bg-red-100 text-red-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const handleOpenChat = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('openFloatingChat'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm animate-fadeIn">
      <div className="container mx-auto px-4 py-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">Recherche</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher des prix, événements, services, annonces..."
            className="pl-12 pr-4 h-14 text-lg bg-card border-border rounded-2xl shadow-lg"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {results.length > 0 ? (
            <div className="grid gap-4">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  to={result.url}
                  onClick={onClose}
                  className="block p-4 bg-card rounded-xl border border-border hover:shadow-lg hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getTypeColor(result.type)}`}>
                      <span className="text-xl">{getTypeIcon(result.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(result.type)}`}>
                          {getTypeLabel(result.type)}
                        </span>
                        {result.category && (
                          <span className="text-xs text-muted-foreground">{result.category}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{result.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{result.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : hasSearched && !isSearching ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-muted-foreground mb-6">
                Aucune information correspondant à "{searchTerm}" n'a été trouvée sur le site.
              </p>
              <Button onClick={handleOpenChat} className="gap-2 bg-gradient-to-r from-emerald-500 to-ocean-500">
                <MessageCircle className="h-4 w-4" />
                Ouvrir le chat pour plus d'assistance
              </Button>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Commencez à taper pour rechercher...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullScreenSearch;
