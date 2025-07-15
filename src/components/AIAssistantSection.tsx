
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, MessageCircle, Sparkles, HelpCircle, Clock } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'info' | 'suggestion' | 'answer';
}

const AIAssistantSection = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Bonjour ! Je suis UJAMAA AI, votre assistant intelligent pour les Comores. Je peux vous aider à trouver des informations sur les prix, événements, services publics et bien plus encore. Comment puis-je vous aider aujourd'hui ?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickQuestions = [
    "Quels sont les prix du riz aujourd'hui ?",
    "Y a-t-il des événements cette semaine ?",
    "Comment obtenir un passeport ?",
    "Quels sont les appels d'offres en cours ?",
    "Où trouver un médecin à Moroni ?",
    "Comment s'inscrire à l'université ?"
  ];

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('prix') || lowerMessage.includes('marché') || lowerMessage.includes('riz') || lowerMessage.includes('coût')) {
      return `🏪 Pour les prix actuels :\n\n• **Riz blanc importé** : 1,500 FC/kg au marché de Volo-Volo\n• **Bananes locales** : 500 FC/régime à Mutsamudu\n• **Poisson thon** : 2,000 FC/kg à Mohéli\n\nPour des informations détaillées, consultez notre section "Prix & Marchés". Les prix sont mis à jour quotidiennement par nos partenaires locaux.`;
    }
    
    if (lowerMessage.includes('événement') || lowerMessage.includes('festival') || lowerMessage.includes('spectacle')) {
      return `🎭 Événements à venir :\n\n• **Festival Culturel de Moroni** - 15 février 2024\n• **Conférence Agriculture Durable** - 20 février 2024 (Anjouan)\n• **Tournoi Football Inter-îles** - 25 février 2024 (Mohéli)\n\nTous les détails sont disponibles dans la section "Événements" avec possibilité de filtrer par île et catégorie.`;
    }
    
    if (lowerMessage.includes('passeport') || lowerMessage.includes('carte') || lowerMessage.includes('identité') || lowerMessage.includes('documents')) {
      return `📄 Pour obtenir vos documents :\n\n**Passeport :**\n• Rendez-vous à la Préfecture de votre île\n• Horaires : Lun-Ven 7h30-15h30\n• Documents : Acte de naissance + 2 photos + 15,000 FC\n\n**Carte d'identité :**\n• Même lieu, 5,000 FC\n• Délai : 2-3 semaines\n\nPour plus d'infos, consultez la section "Services Publics".`;
    }
    
    if (lowerMessage.includes('appel') || lowerMessage.includes('offre') || lowerMessage.includes('marché public') || lowerMessage.includes('soumission')) {
      return `📋 Appels d'offres actuels :\n\n• **Centre de Santé à Anjouan** - Budget 2,5M KMF (expire le 15 mars)\n• **Routes Mohéli** - Budget 5,8M KMF (expire bientôt !)\n• **Équipements informatiques** - Budget 3,4M KMF\n\nTous les détails et dossiers sont dans "Appels d'Offres" avec critères et exigences.`;
    }
    
    if (lowerMessage.includes('médecin') || lowerMessage.includes('hôpital') || lowerMessage.includes('santé') || lowerMessage.includes('docteur')) {
      return `🏥 Services de santé :\n\n**Hôpital National El-Maarouf (Moroni) :**\n• Urgences 24h/24\n• Tél : +269 73 20 45\n• Services : Consultation, hospitalisation, laboratoire\n\n**Centres de santé par île :**\n• Grande Comore : 12 centres\n• Anjouan : 8 centres\n• Mohéli : 4 centres\n\nConsultez "Services Publics" pour la liste complète.`;
    }
    
    if (lowerMessage.includes('université') || lowerMessage.includes('étude') || lowerMessage.includes('inscription') || lowerMessage.includes('formation')) {
      return `🎓 Éducation et formation :\n\n**Université des Comores :**\n• Inscriptions 2024-2025 ouvertes jusqu'au 31 janvier\n• Candidatures en ligne sur le portail officiel\n• Filières : Droit, Médecine, Gestion, Sciences\n\n**Formation professionnelle :**\n• Centre de Formation Mohéli : Mécanique, électricité, informatique\n\nDétails dans "Services Publics > Éducation".`;
    }
    
    if (lowerMessage.includes('transport') || lowerMessage.includes('bus') || lowerMessage.includes('taxi') || lowerMessage.includes('voyage')) {
      return `🚌 Transports disponibles :\n\n**Nouvelle ligne Moroni-Mitsamiouli :**\n• 8 rotations quotidiennes\n• Tarif : 300 FC\n• Horaires : 6h00 - 18h00\n\n**Inter-îles :**\n• Liaisons maritimes quotidiennes\n• Vols domestiques 3x/semaine\n\nPlus d'infos dans nos annonces transport.`;
    }
    
    return `🤖 Merci pour votre question ! Je fais de mon mieux pour vous aider avec les informations disponibles sur UJAMAA.\n\nPour cette demande spécifique, je vous recommande de :\n• Consulter les différentes sections du site\n• Contacter directement les services concernés\n• Vérifier les annonces récentes\n\nY a-t-il autre chose sur laquelle je peux vous aider ? Je suis expert en prix des marchés, événements, services publics et appels d'offres des Comores.`;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simuler un délai de réponse de l'IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date(),
        type: 'answer'
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
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

  return (
    <section className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black gradient-text">
          🤖 Assistant IA UJAMAA
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Posez vos questions sur les prix, événements, services et plus encore. 
          <span className="text-emerald-600 font-semibold"> Notre IA vous répond instantanément</span> avec des informations précises et à jour.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Zone de chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col glass-effect">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <Bot className="w-6 h-6" />
                UJAMAA AI Assistant
                <Badge className="bg-white/20 text-white border-white/30">
                  En ligne
                </Badge>
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
                        ? 'bg-gradient-to-r from-emerald-500 to-ocean-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-600">UJAMAA AI</span>
                        {message.type && (
                          <Badge variant="outline" className="text-xs">
                            {message.type === 'info' ? 'Info' : 
                             message.type === 'suggestion' ? 'Suggestion' : 'Réponse'}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="whitespace-pre-line">{message.content}</div>
                    <div className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-2xl max-w-[80%]">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-600">UJAMAA AI</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Posez votre question sur les Comores..."
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
                Questions populaires
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
                Capacités de l'IA
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
                  <span>Événements et activités</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Services publics et horaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Appels d'offres et marchés</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Informations par île</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Conseils et orientations</span>
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
