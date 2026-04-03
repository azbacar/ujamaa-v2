import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, MessageCircle, Loader2, AlertTriangle, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import PriceDetailDialog from '@/components/PriceDetailDialog';

interface SearchResult {
  id: string;
  type: 'price' | 'event' | 'service' | 'announcement' | 'tender' | 'gastronomy' | 'alert' | 'page';
  title: string;
  description: string;
  url: string;
  category?: string;
  priceData?: any;
}

interface AIChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface FullScreenSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const normalizeSearchTerm = (value: string) =>
  value.toLowerCase().replace(/[%*,()'"`]/g, ' ').replace(/\s+/g, ' ').trim();

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

// ─── AI Chat Tab ───────────────────────────────────────────────
const AISearchChat = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const LOCAL_STORAGE_SESSION_KEY = 'floating_chat_session_id';

  const sessionId = user?.id ?? (() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_SESSION_KEY) || 'guest';
    } catch { return 'guest'; }
  })();

  // Load existing chat history from localStorage (same as FloatingChatbox)
  useEffect(() => {
    const storageKey = `floating_chat_history_${sessionId}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const restored: AIChatMessage[] = parsed.map((m: any) => ({
          id: m.id,
          text: m.text,
          isUser: m.isUser,
          timestamp: new Date(m.timestamp),
        }));
        if (restored.length > 0) {
          setMessages(restored);
          return;
        }
      }
    } catch {}
    setMessages([{
      id: '1',
      text: "🌺 Salut ! Je suis l'assistant UJAMAA. Posez-moi vos questions sur les Comores et Mayotte !",
      isUser: false,
      timestamp: new Date(),
    }]);
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
  }, [messages]);

  // Sync messages back to localStorage so FloatingChatbox picks them up
  const syncToLocalStorage = useCallback((msgs: AIChatMessage[]) => {
    const storageKey = `floating_chat_history_${sessionId}`;
    try {
      const serializable = msgs.map(m => ({
        id: m.id,
        text: m.text,
        isUser: m.isUser,
        timestamp: m.timestamp.toISOString(),
      }));
      localStorage.setItem(storageKey, JSON.stringify(serializable));
    } catch {}
  }, [sessionId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const sanitized = DOMPurify.sanitize(trimmed);

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      text: sanitized,
      isUser: true,
      timestamp: new Date(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    syncToLocalStorage(newMessages);
    setInput('');
    setLoading(true);

    // Save to DB for logged-in users
    if (user) {
      try {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          session_id: sessionId,
          role: 'user',
          content: sanitized,
        });
      } catch {}
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: sanitized, sessionId, context: 'fullscreen_search' },
      });
      if (error) throw error;

      const responseText = data?.response || "Désolé, je n'ai pas pu traiter votre demande.";
      const aiMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      syncToLocalStorage(updatedMessages);

      if (user) {
        try {
          await supabase.from('chat_messages').insert({
            user_id: user.id,
            session_id: sessionId,
            role: 'assistant',
            content: responseText,
          });
        } catch {}
      }
    } catch {
      const errMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        text: '⏳ Erreur temporaire, veuillez réessayer.',
        isUser: false,
        timestamp: new Date(),
      };
      const updatedMessages = [...newMessages, errMsg];
      setMessages(updatedMessages);
      syncToLocalStorage(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!msg.isUser && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-ocean-500 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">IA</span>
                  </div>
                )}
                <div className="max-w-[80%]">
                  <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.isUser
                      ? 'bg-gradient-to-br from-emerald-500 to-ocean-500 text-white rounded-br-md'
                      : 'bg-muted/60 text-foreground rounded-bl-md border border-border/50'
                  }`}>
                    {msg.isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="prose-chat">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                            strong: ({ children }) => <span className="font-semibold">{children}</span>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                          }}
                        >{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <div className={`text-[10px] text-muted-foreground px-1 mt-0.5 ${msg.isUser ? 'text-right' : ''}`}>
                    {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-ocean-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">IA</span>
                </div>
                <div className="bg-muted/60 border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="shrink-0 p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Posez votre question à l'assistant..."
            className="flex-1 h-11 rounded-xl bg-muted/40 border-border/50"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-emerald-500 to-ocean-500"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Search Results Tab ────────────────────────────────────────
const SearchResults = ({
  searchTerm, results, isSearching, hasSearched, searchErrors, onClose, onOpenChat,
}: {
  searchTerm: string;
  results: SearchResult[];
  isSearching: boolean;
  hasSearched: boolean;
  searchErrors: string[];
  onClose: () => void;
  onOpenChat: () => void;
}) => {
  const getTypeIcon = (type: SearchResult['type']) => {
    const icons: Record<string, string> = {
      price: '💰', event: '🎭', service: '🏛️', announcement: '📢',
      tender: '📋', gastronomy: '🍽️', alert: '🚨', page: '📄',
    };
    return icons[type] || '📄';
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    const labels: Record<string, string> = {
      price: 'Prix', event: 'Événement', service: 'Service',
      announcement: 'Annonce', tender: 'Appel d\'offres',
      gastronomy: 'Gastronomie', alert: 'Alerte', page: 'Page',
    };
    return labels[type] || 'Autre';
  };

  const getTypeColor = (type: SearchResult['type']) => {
    const colors: Record<string, string> = {
      price: 'bg-green-100 text-green-700', event: 'bg-purple-100 text-purple-700',
      service: 'bg-blue-100 text-blue-700', announcement: 'bg-orange-100 text-orange-700',
      tender: 'bg-yellow-100 text-yellow-700', gastronomy: 'bg-pink-100 text-pink-700',
      alert: 'bg-red-100 text-red-700', page: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {searchErrors.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Certaines sources n'ont pas répondu : {searchErrors.join(', ')}.</span>
        </div>
      )}
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
          <h3 className="text-xl font-semibold text-foreground mb-2">Aucun résultat trouvé</h3>
          <p className="text-muted-foreground mb-6">
            Aucune information correspondant à "{searchTerm}" n'a été trouvée.
          </p>
          <Button onClick={onOpenChat} className="gap-2 bg-gradient-to-r from-emerald-500 to-ocean-500">
            <Bot className="h-4 w-4" />
            Demander à l'assistant IA
          </Button>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Commencez à taper pour rechercher...</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────
const FullScreenSearch = ({ isOpen, onClose }: FullScreenSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchErrors, setSearchErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'ai'>('search');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current && activeTab === 'search') {
      inputRef.current.focus();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Search logic
  useEffect(() => {
    if (activeTab !== 'search') return;
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
        static_pages: 'Pages',
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
              id: e.id, type: 'event' as const, title: e.title,
              description: e.description || '', url: `/evenements/${e.id}`,
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
            items: dedupeById(rows).slice(0, 10).map((c) => {
              const mapped = typeMap[c.type] || { type: 'announcement' as const, url: (id: string) => `/annonces/${id}` };
              return {
                id: c.id, type: mapped.type, title: c.title,
                description: c.description || '', url: mapped.url(c.id),
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
              id: p.id, type: 'price' as const, title: p.product,
              description: `${p.market} - ${p.island}`, url: '/prix',
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
              id: g.id, type: 'gastronomy' as const, title: g.title,
              description: g.description || '', url: `/annonces/${g.id}`,
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
              id: a.id, type: 'alert' as const, title: a.title,
              description: a.content || '', url: '/',
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
              id: p.id, type: 'page' as const, title: p.title,
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
  }, [searchTerm, activeTab]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background" style={{ opacity: 1 }}>
      <div className="container mx-auto px-4 py-6 sm:py-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {activeTab === 'search' ? 'Recherche' : 'Assistant IA'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'search' ? 'default' : 'outline'}
            onClick={() => setActiveTab('search')}
            className="gap-2 rounded-xl"
            size="sm"
          >
            <Search className="h-4 w-4" />
            Rechercher
          </Button>
          <Button
            variant={activeTab === 'ai' ? 'default' : 'outline'}
            onClick={() => setActiveTab('ai')}
            className={`gap-2 rounded-xl ${activeTab === 'ai' ? 'bg-gradient-to-r from-emerald-500 to-ocean-500' : ''}`}
            size="sm"
          >
            <Bot className="h-4 w-4" />
            Assistant IA
          </Button>
        </div>

        {activeTab === 'search' ? (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
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

            <SearchResults
              searchTerm={searchTerm}
              results={results}
              isSearching={isSearching}
              hasSearched={hasSearched}
              searchErrors={searchErrors}
              onClose={onClose}
              onOpenChat={() => setActiveTab('ai')}
            />
          </>
        ) : (
          <AISearchChat onClose={onClose} />
        )}
      </div>
    </div>,
    document.body
  );
};

export default FullScreenSearch;
