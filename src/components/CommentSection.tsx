import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Comment {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  username?: string;
}

interface CommentSectionProps {
  contentType: string;
  contentId: string;
}

export default function CommentSection({ contentType, contentId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [contentId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('content_comments')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch usernames
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);

      const userMap = Object.fromEntries((users || []).map(u => [u.id, u.username]));
      setComments(data.map(c => ({ ...c, username: userMap[c.user_id] || 'Utilisateur' })));
    }
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Connectez-vous pour commenter'); return; }
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('content_comments').insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        body: newComment.trim(),
      });
      if (error) throw error;
      setNewComment('');
      fetchComments();
      toast.success('Commentaire ajouté');
    } catch {
      toast.error('Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await supabase.from('content_comments').delete().eq('id', commentId);
      fetchComments();
      toast.success('Commentaire supprimé');
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Commentaires ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user && (
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Écrire un commentaire..."
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleSubmit} disabled={loading} size="icon" className="self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun commentaire</p>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => (
              <div key={comment.id} className="p-3 rounded-lg border bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-sm">{comment.username}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {user?.id === comment.user_id && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(comment.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm mt-1">{comment.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
