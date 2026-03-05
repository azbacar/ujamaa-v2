import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, Flag, FileText, Eye } from 'lucide-react';
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
}

export default function ModerationQueueSection() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [drafts, setDrafts] = useState<DraftContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [reportsRes, draftsRes] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('content_items').select('*').eq('status', 'draft').order('created_at', { ascending: false }),
    ]);
    setReports(reportsRes.data || []);
    setDrafts(draftsRes.data || []);
    setLoading(false);
  };

  const handleReportAction = async (reportId: string, status: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('reports').update({ status, reviewed_by: user.id }).eq('id', reportId);
      if (error) throw error;
      toast.success(`Signalement ${status === 'reviewed' ? 'traité' : 'rejeté'}`);
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleContentAction = async (contentId: string, action: 'published' | 'archived') => {
    try {
      const { error } = await supabase.from('content_items').update({ status: action }).eq('id', contentId);
      if (error) throw error;
      toast.success(action === 'published' ? 'Contenu publié' : 'Contenu rejeté');
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending');
  const pendingDrafts = drafts;

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-amber-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            File d'attente de modération
          </CardTitle>
          <CardDescription>
            {pendingReports.length} signalement(s) en attente · {pendingDrafts.length} contenu(s) à valider
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="reports">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" /> Signalements ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Contenus en attente ({pendingDrafts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : pendingReports.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun signalement en attente</CardContent></Card>
          ) : (
            pendingReports.map(report => (
              <Card key={report.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">{report.reason}</Badge>
                        <Badge variant="outline">{report.content_type}</Badge>
                      </div>
                      {report.details && <p className="text-sm text-muted-foreground">{report.details}</p>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString('fr-FR')}
                      </p>
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
            ))
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : pendingDrafts.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Aucun contenu en attente</CardContent></Card>
          ) : (
            pendingDrafts.map(item => (
              <Card key={item.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleContentAction(item.id, 'published')}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Publier
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleContentAction(item.id, 'archived')}>
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
