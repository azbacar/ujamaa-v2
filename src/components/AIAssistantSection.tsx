
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, MessageCircle, Sparkles, HelpCircle, Clock, Zap, AlertCircle, Maximize2, X, ExternalLink } from 'lucide-react';
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
}

const AIAssistantSection = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis UJAMAA IA, votre assistant intelligent pour Mayotte et les Comores. Comment puis-je vous aider aujourd\'hui ?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      links.push({
        text: match[1],
        url: match[2]
      });
    }
    
    return links;
  };

  const callAIFunction = async (userMessage: string): Promise<{ response: string; links: Link[] }> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage,
          sessionId: sessionId,
        },
      });

      if (error) {
        console.error('AI function error:', error);
        throw error;
      }

      const links = extractLinksFromResponse(data.response);
      return { response: data.response, links };
    } catch (error) {
      console.error('Error calling AI function:', error);
      return { 
        response: "Désolé, je rencontre actuellement des difficultés techniques. Veuillez réessayer dans quelques instants. En attendant, vous pouvez consulter directement les sections du site UJAMAA pour vos recherches.",
        links: []
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

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
      
      toast({
        title: "Réponse reçue",
        description: "UJAMAA IA a répondu à votre question.",
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'answer'
      };
      
      setMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: "Erreur",
        description: "Impossible de contacter l'assistant IA. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleLinkClick = (url: string) => {
    if (url.startsWith('/')) {
      navigate(url);
      if (isFullscreen) {
        setIsFullscreen(false);
      }
    } else {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-500 to-ocean-500">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">UJAMAA IA</h2>
            <Badge className="bg-white/20 text-white border-white/30">En ligne</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-ocean-500 text-white shadow-lg'
                    : 'bg-card text-card-foreground border shadow-sm'
                }`}
              >
                {message.sender === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-600">UJAMAA IA</span>
                    {message.type && (
                      <Badge variant="outline" className="text-xs">
                        {message.type === 'info' ? 'Info' : 
                         message.type === 'suggestion' ? 'Suggestion' : 'Réponse'}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="whitespace-pre-line">{message.content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')}</div>
                
                {message.links && message.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.links.map((link, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLinkClick(link.url)}
                        className="gap-2"
                      >
                        {link.text}
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    ))}
                  </div>
                )}

                <div className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                }`}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border p-4 rounded-2xl max-w-[80%] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-ocean-500 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">UJAMAA IA</span>
                  <span className="text-xs text-muted-foreground">réfléchit...</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Posez votre question à UJAMAA IA..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
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
            UJAMAA IA
          </h2>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Votre assistant intelligent pour Mayotte et les Comores
        </p>
        <Button 
          size="lg"
          className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          onClick={() => setIsFullscreen(true)}
        >
          <Maximize2 className="w-5 h-5 mr-2" />
          Lancer UJAMAA IA
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Zone de chat */}
        <div className="lg:col-span-2" id="chat-section">
          <Card className="h-[600px] flex flex-col bg-white shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6" />
                  UJAMAA IA
                  <Badge className="bg-white/20 text-white border-white/30">
                    En ligne
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(true)}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize2 className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-ocean-500 text-white shadow-lg'
                        : 'bg-card text-card-foreground border shadow-sm'
                    }`}
                  >
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-600">UJAMAA IA</span>
                        {message.type && (
                          <Badge variant="outline" className="text-xs">
                            {message.type === 'info' ? 'Info' : 
                             message.type === 'suggestion' ? 'Suggestion' : 'Réponse'}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="whitespace-pre-line">{message.content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')}</div>
                    
                    {message.links && message.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.links.map((link, idx) => (
                          <Button
                            key={idx}
                            size="sm"
                            variant="secondary"
                            onClick={() => handleLinkClick(link.url)}
                            className="gap-2"
                          >
                            {link.text}
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border p-4 rounded-2xl max-w-[80%] shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-ocean-500 rounded-full flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">UJAMAA IA</span>
                      <span className="text-xs text-muted-foreground">réfléchit...</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Posez votre question à UJAMAA IA..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
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
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Prix des marchés en temps réel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Informations sur Mayotte et les Comores</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Services publics et démarches</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Événements et activités culturelles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Transport inter-îles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Conseils et orientations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Aide administrative Mayotte</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AIAssistantSection;
