import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

const normalizeSearchTerm = (value: string) =>
  value
    .toLowerCase()
    .replace(/[%*,()'"`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const dedupeById = <T extends { id: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const dedupeResults = (items: SearchResult[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

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
    const normalized = normalizeSearchTerm(searchTerm);

    if (!normalized) {
      setResults([]);
      setSearchErrors([]);
      setHasSearched(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);

      const pattern = `%${normalized}%`;
      const sourceLabels: Record<string, string> = {
        events: 'Événements',
        content_items: 'Annonces/Services/Appels d\'offres',
        prices: 'Prix',
        gastronomy_items: 'Gastronomie',
        global_announcements: 'Alertes',
      };

      const tasks: Array<Promise<{ source: string; items: SearchResult[]; failed: boolean }>> = [
        (async () => {
          const [byTitle, byDescription, byCategory] = await Promise.all([
            supabase.from('events').select('id, title, description, category').eq('status', 'published').ilike('title', pattern).limit(5),
            supabase.from('events').select('id, title, description, category').eq('status', 'published').ilike('description', pattern).limit(5),
            supabase.from('events').select('id, title, description, category').eq('status', 'published').ilike('category', pattern).limit(5),
          ]);

          const rows = [...(byTitle.data || []), ...(byDescription.data || []), ...(byCategory.data || [])];
          return {
            source: 'events',
            failed: Boolean(byTitle.error || byDescription.error || byCategory.error),
            items: dedupeById(rows).slice(0, 5).map((e) => ({
              id: e.id,
              type: 'event',
              title: e.title,
              description: e.description || '',
              url: `/evenements/${e.id}`,
              category: e.category || undefined,
            })),
          };
        })(),
        (async () => {
          const [byTitle, byDescription, byCategory] = await Promise.all([
            supabase.from('content_items').select('id, title, description, type, category').eq('status', 'published').ilike('title', pattern).limit(10),
            supabase.from('content_items').select('id, title, description, type, category').eq('status', 'published').ilike('description', pattern).limit(10),
            supabase.from('content_items').select('id, title, description, type, category').eq('status', 'published').ilike('category', pattern).limit(10),
          ]);

          const rows = [...(byTitle.data || []), ...(byDescription.data || []), ...(byCategory.data || [])];
          const typeMap: Record<string, { type: SearchResult['type']; url: (id: string) => string }> = {
            announcement: { type: 'announcement', url: (id) => `/annonces/${id}` },
            service: { type: 'service', url: (id) => `/services/${id}` },
            tender: { type: 'tender', url: (id) => `/appels-offres/${id}` },
          };

          return {
            source: 'content_items',
            failed: Boolean(byTitle.error || byDescription.error || byCategory.error),
            items: dedupeById(rows)
              .slice(0, 10)
              .map((c) => {
                const mapped = typeMap[c.type] || { type: 'announcement' as SearchResult['type'], url: (id: string) => `/annonces/${id}` };
                return {
                  id: c.id,
                  type: mapped.type,
                  title: c.title,
                  description: c.description || '',
                  url: mapped.url(c.id),
                  category: c.category || undefined,
                };
              }),
          };
        })(),
        (async () => {
          const [byProduct, byCategory, byMarket] = await Promise.all([
            supabase.from('prices').select('id, product, category, market, island').eq('status', 'published').ilike('product', pattern).limit(5),
            supabase.from('prices').select('id, product, category, market, island').eq('status', 'published').ilike('category', pattern).limit(5),
            supabase.from('prices').select('id, product, category, market, island').eq('status', 'published').ilike('market', pattern).limit(5),
          ]);

          const rows = [...(byProduct.data || []), ...(byCategory.data || []), ...(byMarket.data || [])];
          return {
            source: 'prices',
            failed: Boolean(byProduct.error || byCategory.error || byMarket.error),
            items: dedupeById(rows).slice(0, 5).map((p) => ({
              id: p.id,
              type: 'price',
              title: p.product,
              description: `${p.market} - ${p.island}`,
              url: '/prix',
              category: p.category,
            })),
          };
        })(),
        (async () => {
          const [byTitle, byDescription, byCategory] = await Promise.all([
            supabase.from('gastronomy_items').select('id, title, description, category').eq('status', 'published').ilike('title', pattern).limit(5),
            supabase.from('gastronomy_items').select('id, title, description, category').eq('status', 'published').ilike('description', pattern).limit(5),
            supabase.from('gastronomy_items').select('id, title, description, category').eq('status', 'published').ilike('category', pattern).limit(5),
          ]);

          const rows = [...(byTitle.data || []), ...(byDescription.data || []), ...(byCategory.data || [])];
          return {
            source: 'gastronomy_items',
            failed: Boolean(byTitle.error || byDescription.error || byCategory.error),
            items: dedupeById(rows).slice(0, 5).map((g) => ({
              id: g.id,
              type: 'gastronomy',
              title: g.title,
              description: g.description || '',
              url: `/gastronomie/${g.id}`,
              category: g.category || undefined,
            })),
          };
        })(),
        (async () => {
          const [byTitle, byContent] = await Promise.all([
            supabase.from('global_announcements').select('id, title, content, type').ilike('title', pattern).limit(5),
            supabase.from('global_announcements').select('id, title, content, type').ilike('content', pattern).limit(5),
          ]);

          const rows = [...(byTitle.data || []), ...(byContent.data || [])];
          return {
            source: 'global_announcements',
            failed: Boolean(byTitle.error || byContent.error),
            items: dedupeById(rows).slice(0, 5).map((a) => ({
              id: a.id,
              type: 'alert' as SearchResult['type'],
              title: a.title,
              description: a.content || '',
              url: '/',
              category: a.type,
            })),
          };
        })(),
        (async () => {
          const [byTitle, byContent] = await Promise.all([
            supabase.from('static_pages').select('id, title, slug, content, meta_description').ilike('title', pattern).limit(5),
            supabase.from('static_pages').select('id, title, slug, content, meta_description').ilike('content', pattern).limit(5),
          ]);

          const rows = [...(byTitle.data || []), ...(byContent.data || [])];
          return {
            source: 'static_pages',
            failed: Boolean(byTitle.error || byContent.error),
            items: dedupeById(rows).slice(0, 5).map((p) => ({
              id: p.id,
              type: 'page' as SearchResult['type'],
              title: p.title,
              description: p.meta_description || p.content?.substring(0, 120) || '',
              url: `/page/${p.slug}`,
            })),
          };
        })(),
      ];

      try {
        const settled = await Promise.allSettled(tasks);
        const nextResults: SearchResult[] = [];
        const failedSources: string[] = [];

        settled.forEach((result) => {
          if (result.status === 'fulfilled') {
            nextResults.push(...result.value.items);
            if (result.value.failed) {
              failedSources.push(sourceLabels[result.value.source] || result.value.source);
            }
          } else {
            failedSources.push('Source indisponible');
          }
        });

        setSearchErrors(Array.from(new Set(failedSources)));
        setResults(dedupeResults(nextResults));
      } catch (error) {
        setSearchErrors(['Recherche indisponible']);
        setResults([]);
        console.error('Erreur de recherche:', error);
      } finally {
        setIsSearching(false);
      }
    }, 120);

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

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950" style={{ opacity: 1 }}>
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

        {/* Error banner */}
        {searchErrors.length > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Certaines sources n'ont pas répondu : {searchErrors.join(', ')}. Les résultats affichés sont partiels.</span>
          </div>
        )}

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
    </div>,
    document.body
  );
};

export default FullScreenSearch;
