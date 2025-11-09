import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  links?: Array<{ url: string; title: string; description: string; text?: string }>;
}

const FloatingChatbox = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [assistantName, setAssistantName] = useState('Assistant UJAMAA');
  const [welcomeMessage, setWelcomeMessage] = useState('🌺 Salut ! Je suis votre guide UJAMAA pour les Comores et Mayotte ! Que cherchez-vous : prix des marchés, événements, services admin... ? 🚀');
  const [assistantEnabled, setAssistantEnabled] = useState(true);

  // Charger les paramètres de l'assistant depuis la base de données
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
          setWelcomeMessage(data.ai_assistant_welcome_message || '🌺 Salut ! Je suis votre guide UJAMAA pour les Comores et Mayotte ! Que cherchez-vous : prix des marchés, événements, services admin... ? 🚀');
          setAssistantEnabled(data.ai_assistant_enabled ?? true);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };

    loadSettings();
  }, []);

  // Écouter l'événement d'ouverture du chat
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

  // Mettre à jour le message de bienvenue quand il change
  useEffect(() => {
    setMessages([{
      id: '1',
      text: welcomeMessage,
      isUser: false,
      timestamp: new Date()
    }]);
  }, [welcomeMessage]);

  // Generate cryptographically secure session ID
  const sessionId = useState(() => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return `chat_${Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')}`;
  })[0];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      const chatContainer = document.querySelector('[data-radix-scroll-area-viewport]');
      if (chatContainer) {
        setTimeout(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
      }
    };
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    // Check if user is authenticated
    if (!user) {
      const loginMessage: Message = {
        id: crypto.randomUUID(),
        text: 'Vous devez être connecté pour utiliser le chat. Veuillez vous connecter.',
        isUser: false,
        timestamp: new Date(),
        links: [{ text: 'Se connecter', url: '/auth', title: 'Connexion', description: 'Se connecter à votre compte' }]
      };
      setMessages(prev => [...prev, loginMessage]);
      return;
    }

    // Input validation
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isLoading) return;
    
    // Validate message length (prevent extremely long messages)
    if (trimmedMessage.length > 1000) {
      console.error('Message trop long');
      return;
    }
    
    // Use DOMPurify for proper sanitization
    const sanitizedMessage = DOMPurify.sanitize(trimmedMessage);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: sanitizedMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: sanitizedMessage,
          sessionId: user.id, // Use user ID for authenticated users
          context: 'floating_chat'
        }
      });

      if (error) throw error;

      // Analyser la réponse pour extraire les liens
      const responseText = data.response || 'Désolé, je n\'ai pas pu traiter votre demande.';
      const links = extractLinksFromResponse(responseText);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        links: links
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Erreur chat:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec l'assistant.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractLinksFromResponse = (response: string): Array<{ url: string; title: string; description: string }> => {
    const links = [];
    
    // Extraction intelligente des liens basée sur le contenu
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('prix') || lowerResponse.includes('marché') || lowerResponse.includes('coût') || lowerResponse.includes('/prix')) {
      links.push({
        url: '/prix',
        title: '💰 Prix et Marchés',
        description: 'Consultez les prix actuels des marchés locaux'
      });
    }
    
    if (lowerResponse.includes('événement') || lowerResponse.includes('festival') || lowerResponse.includes('culture') || lowerResponse.includes('/evenements')) {
      links.push({
        url: '/evenements',
        title: '🎉 Événements',
        description: 'Découvrez festivals et événements culturels'
      });
    }
    
    if (lowerResponse.includes('service') || lowerResponse.includes('administration') || lowerResponse.includes('démarche') || lowerResponse.includes('/services')) {
      links.push({
        url: '/services',
        title: '🏛️ Services Publics',
        description: 'Accédez aux services administratifs'
      });
    }
    
    if (lowerResponse.includes('appel') || lowerResponse.includes('offre') || lowerResponse.includes('marché public') || lowerResponse.includes('/appels-offres')) {
      links.push({
        url: '/appels-offres',
        title: '📋 Appels d\'Offres',
        description: 'Opportunités d\'affaires et marchés publics'
      });
    }
    
    if (lowerResponse.includes('annonce') || lowerResponse.includes('actualité') || lowerResponse.includes('nouvelle') || lowerResponse.includes('/annonces')) {
      links.push({
        url: '/annonces',
        title: '📢 Annonces',
        description: 'Dernières actualités et annonces officielles'
      });
    }

    return links;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Ne pas afficher le chatbot si désactivé
  if (!assistantEnabled) {
    return null;
  }

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
    <Card className={`fixed bottom-6 right-6 w-96 shadow-2xl z-50 transition-all duration-300 ${
      isMinimized ? 'h-14' : 'h-96'
    }`}>
      <CardHeader className="p-4 bg-gradient-to-r from-emerald-500 to-ocean-500 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {assistantName}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-80 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <ScrollArea className="flex-1 p-4" ref={(ref) => {
            if (ref) {
              // Auto-scroll to bottom when new messages arrive
              const scrollElement = ref.querySelector('[data-radix-scroll-area-viewport]');
              if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
              }
            }
          }}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-slideIn`}
                >
                  <div
                     className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                      message.isUser
                        ? 'bg-gradient-to-r from-emerald-500 to-ocean-500 text-white ml-4'
                        : 'bg-white/90 backdrop-blur-sm text-gray-900 border border-blue-200/50 mr-4'
                     }`}
                  >
                     <div className="space-y-2">
                       <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                       {message.links && message.links.length > 0 && (
                         <div className="mt-3 space-y-2">
                           <p className="text-xs font-medium opacity-70">Liens utiles :</p>
                           {message.links.map((link, index) => (
                             <a
                               key={index}
                               href={link.url}
                               className={`block p-3 rounded-lg text-xs transition-all transform hover:scale-105 ${
                                 message.isUser 
                                   ? 'bg-white/20 hover:bg-white/30 text-white' 
                                   : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                               }`}
                             >
                               <div className="font-semibold">{link.title}</div>
                               <div className="opacity-80 mt-1">{link.description}</div>
                             </a>
                           ))}
                         </div>
                       )}
                     </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-slideIn">
                  <div className="bg-white/90 backdrop-blur-sm border border-blue-200/50 p-4 rounded-2xl shadow-sm mr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-ocean-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">AI</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1 bg-white/90"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-r from-emerald-500 to-ocean-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default FloatingChatbox;