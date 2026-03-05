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
  errorType?: 'rate_limit' | 'payment' | 'generic';
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
      if (status === 429 || String(error.message).includes('429')) {
        throw { code: 'RATE_LIMIT' };
      }
      if (status === 402 || String(error.message).includes('402')) {
        throw { code: 'PAYMENT_REQUIRED' };
      }
      throw error;
    }

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

      if (error?.code === 'RATE_LIMIT') {
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

  // Render message text with clickable links
  const renderTextWithLinks = (text: string, isUserMsg: boolean) => {
    const regex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<]+)/g;
    const parts: Array<{ type: 'text' | 'link'; value: string; label?: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      if (match[1] && match[2]) {
        parts.push({ type: 'link', value: match[2], label: match[1] });
      } else if (match[3]) {
        parts.push({ type: 'link', value: match[3] });
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) });

    return (
      <span className="whitespace-pre-line">
        {parts.map((p, i) => {
          if (p.type === 'text') return <span key={i}>{p.value}</span>;
          return (
            <button
              key={i}
              onClick={() => handleLinkClick(p.value)}
              className={`inline-flex items-center gap-1 underline font-medium ${
                isUserMsg ? 'text-white/90 hover:text-white' : 'text-emerald-600 hover:text-emerald-800'
              }`}
            >
              {p.label || (() => {
                const path = p.value.startsWith('/') ? p.value : (() => { try { return new URL(p.value).pathname; } catch { return p.value; } })();
                const labels: Record<string, string> = { '/prix': '💰 Prix et Marchés', '/evenements': '🎉 Événements', '/services': '🏛️ Services', '/appels-offres': '📋 Appels d\'offres', '/annonces': '📢 Annonces', '/tourisme': '🏨 Tourisme' };
                return labels[path] || path.replace(/^\//, '').replace(/-/g, ' ');
              })()}
            </button>
          );
        })}
      </span>
    );
  };

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
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
                {message.errorType === 'rate_limit' ? 'Service surchargé' : message.errorType === 'payment' ? 'Crédit insuffisant' : 'Erreur'}
              </span>
            </div>
          )}

          <div className="text-sm leading-relaxed">{renderTextWithLinks(message.content, message.sender === 'user' && !message.errorType)}</div>
          
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

          {message.links && message.links.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {message.links.map((link, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="secondary"
                  onClick={() => handleLinkClick(link.url)}
                  className="gap-1.5 h-7 text-xs"
                >
                  {link.text}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              ))}
            </div>
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
    <section id="assistant-ia" className="space-y-8">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-ocean-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black gradient-text">
            {aiName}
          </h2>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Votre assistant intelligent pour Mayotte et les Comores
        </p>
        <Button 
          size="lg"
          className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={handleOpenFloatingChat}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Discuter avec {aiName}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Zone de chat */}
        <div className="lg:col-span-2" id="chat-section">
          <Card className="h-[600px] flex flex-col shadow-xl border-0 rounded-2xl overflow-hidden">
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
