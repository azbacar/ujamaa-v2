import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, MessageCircle, User } from 'lucide-react';
import { useConversations, useDirectMessages, useSendMessage, useRealtimeMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';

export default function MessagesPage() {
  const { partnerId } = useParams<{ partnerId?: string }>();
  const { user } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const { data: conversations } = useConversations();
  const { data: messages } = useDirectMessages(partnerId);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  useRealtimeMessages(partnerId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !partnerId) return;
    sendMessage.mutate(
      { receiverId: partnerId, content: newMessage.trim() },
      { onSuccess: () => setNewMessage('') }
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Connectez-vous pour accéder à vos messages</p>
          <Link to="/auth"><Button className="mt-4">Se connecter</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
          <MessageCircle className="h-6 w-6 text-primary" /> Messages
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: '60vh' }}>
          {/* Conversation list - hidden on mobile when a conversation is selected */}
          <Card className={`md:col-span-1 ${partnerId ? 'hidden md:block' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!conversations?.length ? (
                <p className="text-sm text-muted-foreground p-4">Aucune conversation</p>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map(conv => (
                    <Link
                      key={conv.user_id}
                      to={`/messages/${conv.user_id}`}
                      className={`block px-4 py-3 hover:bg-muted/50 transition-colors ${partnerId === conv.user_id ? 'bg-muted' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground flex items-center gap-2">
                          <User className="h-3 w-3" /> {conv.username}
                        </span>
                        {conv.unread_count > 0 && (
                          <Badge variant="default" className="text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card className="md:col-span-2 flex flex-col">
            {partnerId ? (
              <>
                <CardHeader className="pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Link to="/messages" className="md:hidden">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <CardTitle className="text-sm">
                      {conversations?.find(c => c.user_id === partnerId)?.username || 'Conversation'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '50vh' }}>
                  {messages?.map(msg => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                          isMine
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Écrire un message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={sendMessage.isPending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                <p>Sélectionnez une conversation ou contactez un freelancer depuis le répertoire</p>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
