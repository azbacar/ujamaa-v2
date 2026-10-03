import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Send, MessageCircle, Paperclip, FileIcon, Image as ImageIcon, X, Search, CheckCheck } from 'lucide-react';
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
  const [conversationSearch, setConversationSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useRealtimeMessages(partnerId);
  const [searchParams, setSearchParams] = useSearchParams();

  // Pré-remplit le message depuis ?prefill= (ex: bouton "Guidez-moi" carte)
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    if (prefill && partnerId) {
      setNewMessage(prefill);
      searchParams.delete('prefill');
      setSearchParams(searchParams, { replace: true });
    }
  }, [partnerId, searchParams, setSearchParams]);

  // Fetch account types
  useEffect(() => {
    if (!user) return;
    supabase.from('users').select('account_type').eq('id', user.id).single()
      .then(({ data }) => setMyAccountType(data?.account_type || 'free'));
  }, [user]);

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
        if (!user) return;
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, attachment);
        if (uploadError) throw uploadError;

        // chat-attachments bucket is private — use signed URL (1 year)
        const { data: signed, error: signErr } = await supabase.storage
          .from('chat-attachments')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);
        if (signErr) throw signErr;
        attachmentUrl = signed.signedUrl;
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
        {textPart && <p className="whitespace-pre-wrap leading-relaxed">{textPart}</p>}
        {attachmentMatch && (
          <a
            href={attachmentMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2 rounded-md border border-current/15 bg-background/10 px-3 py-2 text-xs font-medium transition-colors hover:bg-background/20"
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

  const getInitials = (name: string) => name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

  const formatConversationTime = (value: string) => {
    const date = new Date(value);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLocaleLowerCase('fr');
    if (!query) return conversations ?? [];
    return (conversations ?? []).filter(conversation =>
      conversation.username.toLocaleLowerCase('fr').includes(query)
      || conversation.last_message.toLocaleLowerCase('fr').includes(query)
    );
  }, [conversationSearch, conversations]);

  const activeConversation = conversations?.find(conversation => conversation.user_id === partnerId);

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
      <main className="messaging-page mx-auto w-full max-w-7xl px-0 py-0 md:px-6 md:py-8">
        <div className="messaging-shell flex min-h-[calc(100dvh-4rem)] overflow-hidden border-y border-border bg-card md:h-[min(760px,calc(100dvh-8rem))] md:min-h-[620px] md:rounded-lg md:border md:shadow-lg">
          <aside className={`w-full shrink-0 border-border bg-muted/35 md:block md:w-[340px] md:border-r ${partnerId ? 'hidden' : 'flex flex-col'}`}>
            <div className="border-b border-border p-5 md:border-b-0 md:p-6 md:pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="messaging-title text-xl font-semibold text-foreground">Messages</h1>
                  <p className="text-xs text-muted-foreground">Vos échanges sur Ujamaan</p>
                </div>
              </div>
              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={conversationSearch}
                  onChange={event => setConversationSearch(event.target.value)}
                  placeholder="Rechercher une conversation"
                  aria-label="Rechercher une conversation"
                  className="h-10 rounded-md border-border bg-card pl-9 shadow-none focus-visible:ring-secondary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {!filteredConversations.length ? (
                <div className="px-5 py-12 text-center">
                  <MessageCircle className="mx-auto h-7 w-7 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {conversationSearch ? 'Aucun résultat' : 'Aucune conversation'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {conversationSearch ? 'Essayez un autre nom ou message.' : 'Vos nouveaux échanges apparaîtront ici.'}
                  </p>
                </div>
              ) : filteredConversations.map(conversation => {
                const isActive = partnerId === conversation.user_id;
                return (
                  <Link
                    key={conversation.user_id}
                    to={`/messages/${conversation.user_id}`}
                    className={`mb-1 flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors ${isActive ? 'border-border bg-card shadow-sm' : 'border-transparent hover:bg-card/70'}`}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className={isActive ? 'bg-secondary/15 font-semibold text-secondary' : 'bg-muted font-semibold text-muted-foreground'}>
                        {getInitials(conversation.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${conversation.unread_count > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                          {conversation.username}
                        </span>
                        <span className="shrink-0 text-[10px] uppercase text-muted-foreground">
                          {formatConversationTime(conversation.last_message_at)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className={`min-w-0 flex-1 truncate text-xs ${conversation.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {conversation.last_message}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] text-secondary-foreground">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>

          <section className={`min-w-0 flex-1 flex-col bg-card ${partnerId ? 'flex' : 'hidden md:flex'}`}>
            {partnerId ? (
              <>
                <header className="flex h-[72px] shrink-0 items-center border-b border-border px-4 md:px-6">
                  <Link to="/messages" className="mr-2 md:hidden" aria-label="Revenir aux conversations">
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary/15 font-semibold text-secondary">
                      {getInitials(activeConversation?.username || 'Conversation')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 min-w-0">
                    <h2 className="messaging-title truncate text-sm font-semibold text-foreground">
                      {activeConversation?.username || 'Conversation'}
                    </h2>
                    <p className="text-xs text-muted-foreground">Conversation privée</p>
                  </div>
                </header>

                <div ref={scrollRef} className="messaging-thread flex-1 space-y-4 overflow-y-auto bg-muted/20 px-4 py-6 md:px-8">
                  {messages?.length ? (
                    <div className="flex justify-center pb-1">
                      <span className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-medium uppercase text-muted-foreground">Aujourd’hui</span>
                    </div>
                  ) : null}
                  {messages?.map(msg => {
                    const isMine = msg.sender_id === user.id;
                    const displayContent = processMessageContent(msg.content, msg.sender_id);
                    return (
                      <div key={msg.id} className={`animate-slideIn flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-secondary/15 text-[9px] font-semibold text-secondary">
                              {getInitials(activeConversation?.username || 'Conversation')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm md:max-w-[72%] ${isMine ? 'rounded-br-sm bg-secondary text-secondary-foreground shadow-sm' : 'rounded-bl-sm border border-border bg-card text-card-foreground shadow-sm'}`}>
                          {renderContent(displayContent)}
                          <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${isMine ? 'text-secondary-foreground/75' : 'text-muted-foreground'}`}>
                            <span>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMine && <CheckCheck className="h-3 w-3" aria-label="Envoyé" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!messages?.length && (
                    <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-foreground">Commencez la conversation</p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">Envoyez votre premier message à {activeConversation?.username || 'ce contact'}.</p>
                    </div>
                  )}
                </div>

                {attachment && (
                  <div className="flex items-center gap-2 border-t border-border bg-muted/20 px-4 pt-3 text-xs text-muted-foreground md:px-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                      <Paperclip className="h-4 w-4" />
                    </div>
                    <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAttachment(null)} aria-label="Retirer la pièce jointe">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-border bg-card p-3 md:p-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-border bg-muted/35 p-1.5 focus-within:border-secondary/50 focus-within:ring-2 focus-within:ring-secondary/10">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-secondary" onClick={() => fileInputRef.current?.click()} aria-label="Joindre un fichier">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Joindre un fichier</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Input value={newMessage} onChange={event => setNewMessage(event.target.value)} placeholder="Écrire un message…" aria-label="Votre message" className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0" />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={sendMessage.isPending || uploading || (!newMessage.trim() && !attachment)} aria-label="Envoyer le message">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <h2 className="messaging-title mt-5 text-lg font-semibold text-foreground">Vos conversations</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Sélectionnez une conversation ou contactez un freelancer depuis le répertoire.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
