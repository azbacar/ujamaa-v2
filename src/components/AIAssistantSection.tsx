import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, MessageCircle, Sparkles, HelpCircle, Clock, Zap, AlertCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface Link {
  url: string;
  text: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'info' | 'suggestion' | 'answer';
  links?: Link[];
  errorType?: 'rate_limit' | 'payment' | 'unavailable' | 'generic';
}

const AIAssistantSection = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiName, setAiName] = useState('UJAMAA IA');
  const [welcomeMessage, setWelcomeMessage] = useState('Bonjour ! Je suis votre assistant intelligent pour Mayotte et les Comores. Comment puis-je vous aider aujourd\'hui ?');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const quickQuestions = [
    "Quels sont les prix du riz aujourd'hui ?",
    "Comment obtenir des papiers à Mayotte ?", 
    "Où trouver un médecin à Moroni ?",
    "Quels sont les événements à Anjouan ?",
    "Comment faire une demande de passeport ?",
    "Quels sont les horaires des bateaux inter-îles ?",
    "Comment bénéficier des aides sociales à Mayotte ?",
    "Où acheter de la vanille de qualité ?"
  ];

  const extractLinksFromResponse = (text: string): Link[] => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: Link[] = [];
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      links.push({ text: match[1], url: match[2] });
    }
    return links;
  };

  const callAIFunction = async (userMessage: string): Promise<{ response: string; links: Link[] }> => {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { message: userMessage, sessionId },
    });

    if (error) {
      const status = (error as any)?.context?.status || (error as any)?.status;
      const errMsg = String(error.message || '');
      if (status === 503 || errMsg.includes('503') || errMsg.includes('ALL_PROVIDERS_FAILED')) {
        throw { code: 'ALL_PROVIDERS_FAILED' };
      }
      if (status === 429 || errMsg.includes('429')) {
        throw { code: 'RATE_LIMIT' };
      }
      if (status === 402 || errMsg.includes('402')) {
        throw { code: 'PAYMENT_REQUIRED' };
      }
      throw error;
    }

    if (data?.code === 'ALL_PROVIDERS_FAILED') throw { code: 'ALL_PROVIDERS_FAILED' };
    if (data?.code === 'RATE_LIMIT') throw { code: 'RATE_LIMIT' };
    if (data?.code === 'PAYMENT_REQUIRED') throw { code: 'PAYMENT_REQUIRED' };

    const links = extractLinksFromResponse(data.response);
    return { response: data.response, links };
  };

  const handleSendMessage = async (retryMsg?: string) => {
    const msg = retryMsg || inputMessage.trim();
    if (!msg) return;

    if (!retryMsg) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: msg,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
    }

    const currentMessage = msg;
    setInputMessage('');
    setIsLoading(true);
    setLastFailedMessage(null);

    // Save user message to DB
    if (user && !retryMsg) {
      try {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          session_id: sessionId,
          role: 'user',
          content: currentMessage,
        });
      } catch (e) {
        console.error('Erreur sauvegarde message:', e);
      }
    }

    try {
      const { response: aiResponseText, links } = await callAIFunction(currentMessage);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
        type: 'answer',
        links
      };
      
      setMessages(prev => [...prev, aiResponse]);

      // Save AI response to DB
      if (user) {
        try {
          await supabase.from('chat_messages').insert({
            user_id: user.id,
            session_id: sessionId,
            role: 'assistant',
            content: aiResponseText,
          });
        } catch (e) {
          console.error('Erreur sauvegarde réponse AI:', e);
        }
      }
    } catch (error: any) {
      console.error('Error getting AI response:', error);

      let errorType: Message['errorType'] = 'generic';
      let errorContent = "Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.";

      if (error?.code === 'ALL_PROVIDERS_FAILED') {
        errorType = 'unavailable';
        errorContent = "🔌 Service IA temporairement indisponible. Nos assistants sont en pause technique — réessayez dans quelques minutes.";
      } else if (error?.code === 'RATE_LIMIT') {
        errorType = 'rate_limit';
        errorContent = "⏳ Le service est temporairement surchargé. Veuillez patienter quelques secondes puis réessayer.";
      } else if (error?.code === 'PAYMENT_REQUIRED') {
        errorType = 'payment';
        errorContent = "💳 Crédit IA insuffisant. Veuillez contacter l'administrateur du site.";
      }

      setLastFailedMessage(currentMessage);

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        sender: 'ai',
        timestamp: new Date(),
        type: 'answer',
        errorType,
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.sender === 'ai' && last.errorType) return prev.slice(0, -1);
        return prev;
      });
      handleSendMessage(lastFailedMessage);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  // Instead of fullscreen, open the floating chatbox
  const handleOpenFloatingChat = () => {
    window.dispatchEvent(new CustomEvent('openFloatingChat'));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLinkClick = (url: string) => {
    if (url.startsWith('/')) {
      navigate(url);
      if (isFullscreen) setIsFullscreen(false);
    } else if (url.includes('ujamaan.com') || url.includes('ujamaa-v2.lovable.app')) {
      try {
        const path = new URL(url).pathname;
        navigate(path);
        if (isFullscreen) setIsFullscreen(false);
      } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const INTERNAL_LABELS: Record<string, string> = {
    '/prix': '💰 Prix et Marchés', '/evenements': '🎉 Événements', '/services': '🏛️ Services',
    '/appels-offres': '📋 Appels d\'offres', '/annonces': '📢 Annonces', '/tourisme': '🏨 Tourisme'
  };

  const resolveInternalPath = (url: string): string | null => {
    if (url.startsWith('/')) return url;
    if (url.includes('ujamaan.com') || url.includes('ujamaa-v2.lovable.app')) {
      try { return new URL(url).pathname; } catch { return null; }
    }
    return null;
  };

  // Render message with markdown formatting and deduplicated link buttons
  const renderTextWithLinks = (text: string, isUserMsg: boolean) => {
    if (isUserMsg) {
      // Strip links from user messages
      const clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/https?:\/\/[^\s<]+/g, '').trim();
      return <span className="whitespace-pre-line">{clean}</span>;
    }

    // Extract unique links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<]+)/g;
    const seen = new Set<string>();
    const uniqueLinks: Array<{ url: string; label: string }> = [];
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(text)) !== null) {
      const url = match[2] || match[3];
      const path = resolveInternalPath(url);
      const key = path || url;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLinks.push({ url, label: match[1] || INTERNAL_LABELS[path || ''] || key.replace(/^\//, '').replace(/-/g, ' ') });
      }
    }

    // Clean text: remove links, collapse whitespace
    const cleanText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/[^\s<]+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return (
      <div className="space-y-2">
        <div className="text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
              strong: ({ children }) => <span className="font-semibold">{children}</span>,
              em: ({ children }) => <span className="italic">{children}</span>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              a: ({ href, children }) => (
                <button onClick={() => href && handleLinkClick(href)} className="text-emerald-600 hover:text-emerald-800 font-medium hover:underline">
                  {children}
                </button>
              ),
              h1: ({ children }) => <p className="font-semibold text-sm mb-1">{children}</p>,
              h2: ({ children }) => <p className="font-semibold text-sm mb-1">{children}</p>,
              h3: ({ children }) => <p className="font-semibold text-sm mb-1">{children}</p>,
            }}
          >
            {cleanText}
          </ReactMarkdown>
        </div>
        {uniqueLinks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {uniqueLinks.map((link, i) => (
              <button
                key={i}
                onClick={() => handleLinkClick(link.url)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 transition-colors"
              >
                {INTERNAL_LABELS[resolveInternalPath(link.url) || ''] || link.label}
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings_public')
        .select('ai_assistant_name, ai_assistant_welcome_message')
        .single();

      if (!error && data) {
        setAiName(data.ai_assistant_name || 'UJAMAA IA');
        const welcome = data.ai_assistant_welcome_message || 'Bonjour ! Je suis votre assistant intelligent pour Mayotte et les Comores. Comment puis-je vous aider aujourd\'hui ?';
        setWelcomeMessage(welcome);
        setMessages([{ id: '1', content: welcome, sender: 'ai', timestamp: new Date(), type: 'info' }]);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isFullscreen]);

  const renderMessage = (message: Message) => (
    <div
      key={message.id}
      className={`flex gap-2.5 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {message.sender === 'ai' && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-ocean-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="max-w-[78%] space-y-1">
        <div
          className={`px-4 py-3 rounded-2xl ${
            message.errorType
              ? 'bg-destructive/10 border border-destructive/20 text-foreground'
              : message.sender === 'user'
              ? 'bg-gradient-to-br from-emerald-500 to-ocean-500 text-white rounded-br-md shadow-md'
              : 'bg-card text-card-foreground rounded-bl-md border border-border/50 shadow-sm'
          }`}
        >
          {message.sender === 'ai' && !message.errorType && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-emerald-600">{aiName}</span>
              {message.type && message.type !== 'answer' && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {message.type === 'info' ? 'Info' : 'Suggestion'}
                </Badge>
              )}
            </div>
          )}

          {message.errorType && (
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive">
                {message.errorType === 'rate_limit' ? 'Service surchargé' : message.errorType === 'payment' ? 'Crédit insuffisant' : message.errorType === 'unavailable' ? 'Service indisponible' : 'Erreur'}
              </span>
            </div>
          )}

          <div className="leading-relaxed">{renderTextWithLinks(message.content, message.sender === 'user' && !message.errorType)}</div>
          
          {message.errorType && lastFailedMessage && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="mt-2 gap-1.5 text-xs h-7 border-destructive/30 hover:bg-destructive/10"
            >
              <RefreshCw className="w-3 h-3" />
              Réessayer
            </Button>
          )}
        </div>

        <div className={`text-[10px] text-muted-foreground px-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
          <Clock className="w-2.5 h-2.5 inline mr-0.5" />
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-ocean-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-emerald-600">{aiName}</span>
          <span className="text-[10px] text-muted-foreground">réfléchit...</span>
        </div>
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-500 to-ocean-500">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">{aiName}</h2>
            <Badge className="bg-white/20 text-white border-white/30">En ligne</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)} className="text-white hover:bg-white/20">
            <ExternalLink className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(renderMessage)}
          {isLoading && renderLoading()}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Posez votre question à ${aiName}...`}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-emerald-500 to-ocean-500"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id="assistant-ia" className="space-y-6 sm:space-y-8">
      <div className="text-center space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-emerald-500 to-ocean-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black gradient-text">
            {aiName}
          </h2>
        </div>
        <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Votre assistant intelligent pour Mayotte et les Comores
        </p>
        <Button 
          size="lg"
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-ocean-500 text-white px-6 sm:px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={handleOpenFloatingChat}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Discuter avec {aiName}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Zone de chat */}
        <div className="lg:col-span-2" id="chat-section">
          <Card className="h-[400px] sm:h-[600px] flex flex-col shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white py-3 px-4">
              <CardTitle className="flex items-center gap-3 justify-between text-base">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold">{aiName}</span>
                    <Badge className="ml-2 bg-white/20 text-white border-white/30 text-[10px] h-4">En ligne</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(true)} className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
              {messages.map(renderMessage)}
              {isLoading && renderLoading()}
              <div ref={messagesEndRef} />
            </CardContent>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Posez votre question à ${aiName}...`}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-emerald-500 to-ocean-500"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Questions rapides */}
        <div className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                {t('ai.popularQuestions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start h-auto p-3 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => handleQuickQuestion(question)}
                >
                  <HelpCircle className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm">{question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                {t('ai.capabilities')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                {['Prix des marchés en temps réel', 'Informations sur Mayotte et les Comores', 'Services publics et démarches', 'Événements et activités culturelles', 'Transport inter-îles', 'Conseils et orientations', 'Aide administrative Mayotte'].map((cap, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AIAssistantSection;
