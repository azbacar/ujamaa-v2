import { useState } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  links?: Array<{ url: string; title: string; description: string }>;
}

const FloatingChatbox = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! Je suis votre assistant UJAMAA. Comment puis-je vous aider aujourd\'hui ?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sessionId = `chat_${Date.now()}`;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: inputMessage,
          sessionId: sessionId,
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
    
    // Rechercher des mentions de pages/sections du site
    if (response.toLowerCase().includes('prix') || response.toLowerCase().includes('marché')) {
      links.push({
        url: '/prix',
        title: 'Page des Prix',
        description: 'Consultez tous les prix des marchés'
      });
    }
    
    if (response.toLowerCase().includes('événement') || response.toLowerCase().includes('festival')) {
      links.push({
        url: '/evenements',
        title: 'Page des Événements',
        description: 'Découvrez tous les événements'
      });
    }
    
    if (response.toLowerCase().includes('service') || response.toLowerCase().includes('administration')) {
      links.push({
        url: '/services',
        title: 'Page des Services',
        description: 'Accédez aux services publics'
      });
    }
    
    if (response.toLowerCase().includes('appel d\'offre') || response.toLowerCase().includes('offre')) {
      links.push({
        url: '/appels-offres',
        title: 'Appels d\'Offres',
        description: 'Consultez les appels d\'offres'
      });
    }
    
    if (response.toLowerCase().includes('annonce')) {
      links.push({
        url: '/annonces',
        title: 'Annonces',
        description: 'Voir toutes les annonces'
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
            Assistant UJAMAA
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
        <CardContent className="p-0 flex flex-col h-80">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                     className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                      message.isUser
                        ? 'bg-gradient-to-r from-emerald-500 to-ocean-500 text-white ml-4'
                        : 'bg-white text-gray-900 border border-gray-200 mr-4'
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
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm mr-4">
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

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className="flex-1"
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