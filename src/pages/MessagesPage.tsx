import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, MessageCircle, User, Paperclip, FileIcon, Image as ImageIcon, X } from 'lucide-react';
import { useConversations, useDirectMessages, useSendMessage, useRealtimeMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { maskSensitiveContent, containsSensitiveContent, canShareSensitiveContent, canSeeSensitiveContent } from '@/lib/chatFilter';
import { authPath, proPath } from '@/lib/authRedirect';

export default function MessagesPage() {
  const { partnerId } = useParams<{ partnerId?: string }>();
  const { user } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const { data: conversations } = useConversations();
  const { data: messages } = useDirectMessages(partnerId);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [myAccountType, setMyAccountType] = useState<string>('free');
  const [partnerAccountType, setPartnerAccountType] = useState<string>('free');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useRealtimeMessages(partnerId);

  // Fetch account types
  useEffect(() => {
    if (!user) return;
    supabase.from('users').select('account_type').eq('id', user.id).single()
      .then(({ data }) => setMyAccountType(data?.account_type || 'free'));
  }, [user]);

  useEffect(() => {
    if (!partnerId) return;
    supabase.from('users').select('account_type').eq('id', partnerId).single()
      .then(({ data }) => setPartnerAccountType(data?.account_type || 'free'));
  }, [partnerId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10 Mo');
      return;
    }
    setAttachment(file);
    e.target.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !partnerId) return;

    // Check if non-pro user tries to send sensitive content
    if (newMessage.trim() && containsSensitiveContent(newMessage) && !canShareSensitiveContent(myAccountType)) {
      toast.error('Le partage de liens, emails et numéros de téléphone est réservé aux abonnés Pro');
      return;
    }

    let attachmentUrl = '';
    let attachmentName = '';
    let attachmentType = '';

    if (attachment) {
      setUploading(true);
      try {
        const ext = attachment.name.split('.').pop();
        const filePath = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, attachment);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachmentUrl = publicUrl;
        attachmentName = attachment.name;
        attachmentType = attachment.type;
      } catch (err: any) {
        toast.error('Erreur upload: ' + err.message);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const content = attachmentUrl
      ? `${newMessage.trim()}${newMessage.trim() ? '\n' : ''}📎 [${attachmentName}](${attachmentUrl})`
      : newMessage.trim();

    sendMessage.mutate(
      { receiverId: partnerId, content },
      {
        onSuccess: (data) => {
          setNewMessage('');
          setAttachment(null);
          // Save attachment metadata
          if (attachmentUrl && data) {
            supabase.from('chat_attachments').insert({
              message_id: data.id,
              file_url: attachmentUrl,
              file_name: attachmentName,
              file_type: attachmentType,
              file_size: attachment?.size || 0,
            } as any).then(() => {});
          }
        }
      }
    );
  };

  // Process message content based on account types
  const processMessageContent = (content: string, senderId: string) => {
    const isMine = senderId === user?.id;
    // If I sent it, show as-is
    if (isMine) return content;
    // If sender is not pro, content shouldn't have sensitive data (blocked at send)
    // If sender is pro but I'm not pro, mask sensitive content
    if (!canSeeSensitiveContent(myAccountType)) {
      return maskSensitiveContent(content);
    }
    return content;
  };

  // Render attachment from message content
  const renderContent = (content: string) => {
    const attachmentMatch = content.match(/📎 \[(.+?)\]\((.+?)\)/);
    const textPart = content.replace(/📎 \[.+?\]\(.+?\)/, '').trim();

    return (
      <>
        {textPart && <p>{textPart}</p>}
        {attachmentMatch && (
          <a
            href={attachmentMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs underline mt-1 opacity-80 hover:opacity-100"
          >
            {attachmentMatch[2].match(/\.(jpg|jpeg|png|gif|webp)$/i)
              ? <ImageIcon className="h-3 w-3" />
              : <FileIcon className="h-3 w-3" />}
            {attachmentMatch[1]}
          </a>
        )}
      </>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Connectez-vous pour accéder à vos messages</p>
          <Link to={authPath()}><Button className="mt-4">Se connecter</Button></Link>
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
          {/* Conversation list */}
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
                    const displayContent = processMessageContent(msg.content, msg.sender_id);
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                          isMine
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}>
                          {renderContent(displayContent)}
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Attachment preview */}
                {attachment && (
                  <div className="px-3 pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate flex-1">{attachment.name}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAttachment(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Écrire un message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={sendMessage.isPending || uploading || (!newMessage.trim() && !attachment)}>
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
