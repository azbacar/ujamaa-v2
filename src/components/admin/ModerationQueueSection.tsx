import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, Flag, FileText, Eye, Calendar, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Report {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
}

interface DraftContent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  author_id: string;
  created_at: string;
  source: 'content_items' | 'events';
}

export default function ModerationQueueSection() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [drafts, setDrafts] = useState<DraftContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [reportsRes, contentDraftsRes, eventDraftsRes] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('content_items').select('id, title, description, type, status, author_id, created_at').eq('status', 'draft').order('created_at', { ascending: false }),
      supabase.from('events').select('id, title, description, status, author_id, created_at').eq('status', 'draft').order('created_at', { ascending: false }),
    ]);
    setReports(reportsRes.data || []);

    const contentDrafts: DraftContent[] = (contentDraftsRes.data || []).map(d => ({ ...d, source: 'content_items' as const }));
    const eventDrafts: DraftContent[] = (eventDraftsRes.data || []).map(d => ({ ...d, type: 'event', source: 'events' as const }));
    setDrafts([...contentDrafts, ...eventDrafts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setLoading(false);
  };

  const handleReportAction = async (reportId: string, status: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('reports').update({ status, reviewed_by: user.id }).eq('id', reportId);
      if (error) throw error;
      toast.success(`Signalement ${status === 'reviewed' ? 'traité' : 'rejeté'}`);
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  const handleContentAction = async (item: DraftContent, action: 'published' | 'archived') => {
    try {
      if (item.source === 'events') {
        // Events table uses 'cancelled' instead of 'archived'
        const eventStatus = action === 'published' ? 'published' : 'cancelled';
        const { error } = await supabase.from('events').update({ status: eventStatus }).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('content_items').update({ status: action }).eq('id', item.id);
        if (error) throw error;
      }
      toast.success(action === 'published' ? 'Contenu publié' : 'Contenu rejeté');
      fetchData();
    } catch (err: any) {
      console.error('Moderation action error:', err);
      toast.error(err?.message || 'Erreur lors de la mise à jour');
    }
  };

  const getContentLink = (report: Report) => {
    switch (report.content_type) {
      case 'announcement': return `/annonces/${report.content_id}`;
      case 'event': return `/evenements/${report.content_id}`;
      case 'service': return `/services/${report.content_id}`;
      case 'tender': return `/appels-offres/${report.content_id}`;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'announcement': return '📢 Annonce';
      case 'event': return '🎭 Événement';
      case 'service': return '🏛️ Service';
      case 'tender': return '📋 Appel d\'offres';
      default: return type;
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 p-6">
      <Card className="border-amber-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-amber-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            File d'attente de modération
          </CardTitle>
          <CardDescription>
            {pendingReports.length} signalement(s) en attente · {drafts.length} contenu(s) à valider
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="reports">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" /> Signalements ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Contenus en attente ({drafts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : pendingReports.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun signalement en attente</CardContent></Card>
          ) : (
            pendingReports.map(report => {
              const link = getContentLink(report);
              return (
                <Card key={report.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{report.reason}</Badge>
                          <Badge variant="outline">{report.content_type}</Badge>
                        </div>
                        {report.details && <p className="text-sm text-muted-foreground">{report.details}</p>}
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          {link && (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Voir le contenu
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleReportAction(report.id, 'reviewed')}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Traité
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleReportAction(report.id, 'dismissed')}>
                          <XCircle className="h-4 w-4 mr-1" /> Rejeter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : drafts.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun contenu en attente</CardContent></Card>
          ) : (
            drafts.map(item => (
              <Card key={`${item.source}-${item.id}`}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{getTypeLabel(item.type)}</Badge>
                        {item.source === 'events' && <Badge variant="outline" className="text-green-600 border-green-200">Table events</Badge>}
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleContentAction(item, 'published')}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Publier
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleContentAction(item, 'archived')}>
                        <XCircle className="h-4 w-4 mr-1" /> Rejeter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
