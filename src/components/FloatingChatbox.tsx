import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';

interface ChatLink {
  url: string;
  title: string;
  description: string;
  text?: string;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  links?: ChatLink[];
  errorType?: 'rate_limit' | 'payment' | 'generic';
}

const LOCAL_STORAGE_SESSION_KEY = 'floating_chat_session_id';

// Render message text with clickable links (markdown + raw URLs)
const RenderMessageText = ({ text, isUser }: { text: string; isUser: boolean }) => {
  const navigate = useNavigate();

  const parts = useMemo(() => {
    const result: Array<{ type: 'text' | 'md_link' | 'url'; value: string; label?: string }> = [];
    // Match markdown links [text](url) and raw URLs
    const regex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }
      if (match[1] && match[2]) {
        result.push({ type: 'md_link', value: match[2], label: match[1] });
      } else if (match[3]) {
        result.push({ type: 'url', value: match[3] });
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      result.push({ type: 'text', value: text.slice(lastIndex) });
    }
    return result;
  }, [text]);

  const handleClick = (url: string) => {
    // Internal links (/prix, /evenements, etc.)
    if (url.startsWith('/')) {
      navigate(url);
    } else if (url.includes('ujamaan.com') || url.includes('ujamaa-v2.lovable.app')) {
      try {
        const path = new URL(url).pathname;
        navigate(path);
      } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <p className="text-sm whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) => {
        if (part.type === 'text') return <span key={i}>{part.value}</span>;
        return (
          <button
            key={i}
            onClick={() => handleClick(part.value)}
            className={`inline-flex items-center gap-1 underline font-medium transition-colors ${
              isUser
                ? 'text-white/90 hover:text-white'
                : 'text-emerald-600 hover:text-emerald-800'
            }`}
          >
            {part.label || (() => {
              // For internal links, show a friendly label
              const path = part.value.startsWith('/') ? part.value : (() => { try { return new URL(part.value).pathname; } catch { return part.value; } })();
              const labels: Record<string, string> = { '/prix': '💰 Prix et Marchés', '/evenements': '🎉 Événements', '/services': '🏛️ Services', '/appels-offres': '📋 Appels d\'offres', '/annonces': '📢 Annonces', '/tourisme': '🏨 Tourisme', '/auth': '🔐 Inscription' };
              return labels[path] || path.replace(/^\//, '').replace(/-/g, ' ');
            })()}
          </button>
        );
      })}
    </p>
  );
};

const FloatingChatbox = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [assistantName, setAssistantName] = useState('Assistant UJAMAA');
  const [welcomeMessage, setWelcomeMessage] = useState(
    "🌺 Salut ! Je suis votre guide UJAMAA pour les Comores et Mayotte ! Que cherchez-vous : prix des marchés, événements, services admin... ? 🚀"
  );
  const [assistantEnabled, setAssistantEnabled] = useState(true);

  const scrollAreaRootRef = useRef<HTMLDivElement | null>(null);

  const [guestSessionId] = useState(() => {
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (existing) return existing;
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      const next = `chat_${Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, next);
      return next;
    } catch {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return `chat_${Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
    }
  });

  const sessionId = user?.id ?? guestSessionId;

  const storageKey = useMemo(() => `floating_chat_history_${sessionId}`, [sessionId]);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('ai_assistant_name, ai_assistant_welcome_message, ai_assistant_enabled')
          .single();
        if (error) throw error;
        if (data) {
          setAssistantName(data.ai_assistant_name || 'Assistant UJAMAA');
          setWelcomeMessage(
            data.ai_assistant_welcome_message ||
              "🌺 Salut ! Je suis votre guide UJAMAA pour les Comores et Mayotte ! Que cherchez-vous : prix des marchés, événements, services admin... ? 🚀"
          );
          setAssistantEnabled(data.ai_assistant_enabled ?? true);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };
    loadSettings();
  }, []);

  // Listen for external open event
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('openFloatingChat', handleOpenChat);
    return () => window.removeEventListener('openFloatingChat', handleOpenChat);
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  // Load history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
        const restored: Message[] = parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
        if (restored.length > 0) {
          setMessages(restored);
          setMessageCount(restored.filter((m) => m.isUser).length);
          return;
        }
      }
    } catch (e) {
      console.warn("Impossible de restaurer l'historique du chat:", e);
    }
    setMessages([{ id: '1', text: welcomeMessage, isUser: false, timestamp: new Date() }]);
    setMessageCount(0);
  }, [storageKey, welcomeMessage]);

  // Persist history
  useEffect(() => {
    try {
      const serializable = messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() }));
      localStorage.setItem(storageKey, JSON.stringify(serializable));
    } catch { /* ignore */ }
  }, [messages, storageKey]);

  // Auto-scroll
  useEffect(() => {
    if (!isOpen || isMinimized) return;
    const root = scrollAreaRootRef.current;
    const viewport = root?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (!viewport) return;
    const id = window.setTimeout(() => { viewport.scrollTop = viewport.scrollHeight; }, 50);
    return () => window.clearTimeout(id);
  }, [messages, isOpen, isMinimized]);

  const extractLinksFromResponse = (response: string): ChatLink[] => {
    const links: ChatLink[] = [];
    const lowerResponse = response.toLowerCase();

    if (lowerResponse.includes('prix') || lowerResponse.includes('marché') || lowerResponse.includes('coût') || lowerResponse.includes('/prix')) {
      links.push({ url: '/prix', title: '💰 Prix et Marchés', description: 'Consultez les prix actuels des marchés locaux' });
    }
    if (lowerResponse.includes('événement') || lowerResponse.includes('festival') || lowerResponse.includes('culture') || lowerResponse.includes('/evenements')) {
      links.push({ url: '/evenements', title: '🎉 Événements', description: 'Découvrez festivals et événements culturels' });
    }
    if (lowerResponse.includes('service') || lowerResponse.includes('administration') || lowerResponse.includes('démarche') || lowerResponse.includes('/services')) {
      links.push({ url: '/services', title: '🏛️ Services Publics', description: 'Accédez aux services administratifs' });
    }
    if (lowerResponse.includes('appel') || lowerResponse.includes('offre') || lowerResponse.includes('marché public') || lowerResponse.includes('/appels-offres')) {
      links.push({ url: '/appels-offres', title: "📋 Appels d'Offres", description: "Opportunités d'affaires et marchés publics" });
    }
    if (lowerResponse.includes('annonce') || lowerResponse.includes('actualité') || lowerResponse.includes('nouvelle') || lowerResponse.includes('/annonces')) {
      links.push({ url: '/annonces', title: '📢 Annonces', description: 'Dernières actualités et annonces officielles' });
    }
    return links;
  };

  const handleSendMessage = async (retryMessage?: string) => {
    const trimmedMessage = (retryMessage || inputMessage).trim();
    if (!trimmedMessage || isLoading) return;
    if (trimmedMessage.length > 1000) { console.error('Message trop long'); return; }

    const sanitizedMessage = DOMPurify.sanitize(trimmedMessage);

    // Don't re-add user message on retry
    if (!retryMessage) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: sanitizedMessage,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    setInputMessage('');
    setIsLoading(true);
    setLastFailedMessage(null);

    // Save user message to DB for logged-in users
    if (user && !retryMessage) {
      try {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          session_id: sessionId,
          role: 'user',
          content: sanitizedMessage,
        });
      } catch (e) {
        console.error('Erreur sauvegarde message user:', e);
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: sanitizedMessage, sessionId, context: 'floating_chat' },
      });

      // Handle edge function errors (429, 402 etc.)
      if (error) {
        // supabase functions.invoke wraps non-2xx as FunctionsHttpError
        const status = (error as any)?.context?.status || (error as any)?.status;
        if (status === 429 || String(error.message).includes('429')) {
          throw { code: 'RATE_LIMIT', message: 'Service surchargé' };
        }
        if (status === 402 || String(error.message).includes('402')) {
          throw { code: 'PAYMENT_REQUIRED', message: 'Crédit insuffisant' };
        }
        throw error;
      }

      // Check if the response itself contains an error code
      if (data?.code === 'RATE_LIMIT' || data?.error?.includes?.('surchargé')) {
        throw { code: 'RATE_LIMIT', message: data.error };
      }
      if (data?.code === 'PAYMENT_REQUIRED') {
        throw { code: 'PAYMENT_REQUIRED', message: data.error };
      }

      const responseText = data.response || "Désolé, je n'ai pas pu traiter votre demande.";
      const links = extractLinksFromResponse(responseText);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        links,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Save AI response to DB
      if (user) {
        try {
          await supabase.from('chat_messages').insert({
            user_id: user.id,
            session_id: sessionId,
            role: 'assistant',
            content: responseText,
          });
        } catch (e) {
          console.error('Erreur sauvegarde réponse AI:', e);
        }
      }

      const newCount = messageCount + 1;
      setMessageCount(newCount);

      // Suggest creating an account for guests
      if (!user && newCount >= 3 && newCount % 3 === 0) {
        const suggestionMessage: Message = {
          id: crypto.randomUUID(),
          text: "Astuce : créez un compte gratuit pour sauvegarder vos conversations.",
          isUser: false,
          timestamp: new Date(),
          links: [{ text: 'Créer un compte', url: '/auth', title: 'Inscription', description: 'Créer un compte gratuit' }],
        };
        setTimeout(() => { setMessages((prev) => [...prev, suggestionMessage]); }, 800);
      }
    } catch (error: any) {
      console.error('Erreur chat:', error);

      let errorType: Message['errorType'] = 'generic';
      let errorText = 'Désolé, une erreur est survenue. Veuillez réessayer.';

      if (error?.code === 'RATE_LIMIT') {
        errorType = 'rate_limit';
        errorText = '⏳ Le service est temporairement surchargé. Veuillez patienter quelques secondes puis réessayer.';
      } else if (error?.code === 'PAYMENT_REQUIRED') {
        errorType = 'payment';
        errorText = '💳 Crédit IA insuffisant. Veuillez contacter l\'administrateur du site.';
      }

      setLastFailedMessage(sanitizedMessage);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
        errorType,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      // Remove the last error message
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && !last.isUser && last.errorType) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      handleSendMessage(lastFailedMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLinkClick = (url: string) => {
    if (url.startsWith('/')) {
      navigate(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!assistantEnabled) return null;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-ocean-500 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Ouvrir le chat</span>
      </Button>
    );
  }

  return (
    <Card
      className={`fixed bottom-6 right-6 w-[360px] sm:w-[400px] shadow-2xl z-50 transition-all duration-300 border-0 rounded-2xl overflow-hidden ${
        isMinimized ? 'h-[56px]' : 'h-[480px]'
      }`}
    >
      {/* Header */}
      <CardHeader className="p-3 bg-gradient-to-r from-emerald-500 to-ocean-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{assistantName}</CardTitle>
              <span className="text-[10px] text-white/70">En ligne</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={() => setIsMinimized(!isMinimized)}>
              <Minimize2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col" style={{ height: 'calc(480px - 56px)' }}>
          {/* Messages area */}
          <div ref={scrollAreaRootRef} className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.isUser ? 'flex-row-reverse' : 'flex-row'} animate-slideIn`}
                  >
                    {/* Avatar */}
                    {!message.isUser && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-ocean-500 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-[10px] font-bold">IA</span>
                      </div>
                    )}

                    <div className="max-w-[78%] space-y-1">
                      <div
                        className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          message.errorType
                            ? 'bg-destructive/10 border border-destructive/20 text-foreground'
                            : message.isUser
                            ? 'bg-gradient-to-br from-emerald-500 to-ocean-500 text-white rounded-br-md'
                            : 'bg-muted/60 text-foreground rounded-bl-md border border-border/50'
                        }`}
                      >
                        {message.errorType && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-[11px] font-semibold text-destructive">
                              {message.errorType === 'rate_limit' ? 'Service surchargé' : message.errorType === 'payment' ? 'Crédit insuffisant' : 'Erreur'}
                            </span>
                          </div>
                        )}

                        <RenderMessageText text={message.text} isUser={message.isUser && !message.errorType} />

                        {message.errorType && lastFailedMessage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRetry}
                            className="mt-2 gap-1.5 text-[11px] h-7 border-destructive/30 hover:bg-destructive/10"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Réessayer
                          </Button>
                        )}

                        {message.links && message.links.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {message.links.map((link, index) => (
                              <button
                                key={index}
                                onClick={() => handleLinkClick(link.url)}
                                className={`block w-full text-left px-2.5 py-2 rounded-lg text-[11px] transition-colors ${
                                  message.isUser
                                    ? 'bg-white/15 hover:bg-white/25 text-white'
                                    : 'bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10'
                                }`}
                              >
                                <div className="font-semibold flex items-center gap-1">
                                  {link.title}
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </div>
                                <div className="opacity-70 mt-0.5">{link.description}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`text-[10px] text-muted-foreground px-1 ${message.isUser ? 'text-right' : ''}`}>
                        {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 animate-slideIn">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-ocean-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">IA</span>
                    </div>
                    <div className="bg-muted/60 border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-border/50 bg-background">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1 text-sm h-9 rounded-xl bg-muted/40 border-border/50 focus-visible:ring-emerald-500/30"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="h-9 w-9 rounded-xl bg-gradient-to-r from-emerald-500 to-ocean-500 hover:opacity-90"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default FloatingChatbox;
