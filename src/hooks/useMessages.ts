import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export interface Conversation {
  user_id: string;
  username: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// Helper to fetch usernames
async function fetchUsernames(ids: string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map();
  const { data } = await supabase.rpc('get_public_usernames', { _user_ids: ids });
  return new Map((data || []).map((u: any) => [u.id, u.username]));
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const convMap = new Map<string, { messages: any[]; unread: number }>();
      (data || []).forEach(msg => {
        const partnerId = msg.sender_id === user!.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) {
          convMap.set(partnerId, { messages: [], unread: 0 });
        }
        const conv = convMap.get(partnerId)!;
        conv.messages.push(msg);
        if (!msg.is_read && msg.receiver_id === user!.id) conv.unread++;
      });

      const partnerIds = [...convMap.keys()];
      const usernameMap = await fetchUsernames(partnerIds);

      const conversations: Conversation[] = partnerIds.map(pid => {
        const conv = convMap.get(pid)!;
        const lastMsg = conv.messages[0];
        return {
          user_id: pid,
          username: usernameMap.get(pid) || 'Anonyme',
          last_message: lastMsg.content,
          last_message_at: lastMsg.created_at,
          unread_count: conv.unread,
        };
      });

      conversations.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      return conversations;
    },
    enabled: !!user,
  });
};

export const useDirectMessages = (partnerId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['direct-messages', user?.id, partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user!.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark unread messages as read
      const unreadIds = (data || [])
        .filter(m => m.receiver_id === user!.id && !m.is_read)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }

      return (data || []) as DirectMessage[];
    },
    enabled: !!user && !!partnerId,
    refetchInterval: 5000, // Poll every 5s
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user!.id,
          receiver_id: receiverId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages', user!.id, data.receiver_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi du message');
    },
  });
};

export const useUnreadCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-messages-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user!.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
};
