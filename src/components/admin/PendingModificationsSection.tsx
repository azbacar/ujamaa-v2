import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  FileText,
  Mail,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PendingModification {
  id: string;
  type: string;
  title: string;
  content: any;
  submitted_by: string;
  status: string;
  created_at: string;
  users?: { username: string; email: string };
}

interface PendingModificationsSectionProps {
  modifications: PendingModification[];
  onReview: (modId: string, action: 'approved' | 'rejected', notes?: string) => void;
}

export default function PendingModificationsSection({
  modifications,
  onReview,
}: PendingModificationsSectionProps) {
  const pendingMods = modifications.filter((mod) => mod.status === 'pending');
  const [selected, setSelected] = useState<PendingModification | null>(null);

  const renderContent = (content: any) => {
    if (content == null) return <p className="text-sm text-muted-foreground">Aucun contenu</p>;
    if (typeof content === 'string') return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    if (typeof content === 'object') {
      return (
        <div className="space-y-2">
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="border-b border-border/50 pb-2 last:border-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {key}
              </p>
              <div className="text-sm mt-1 break-words">
                {typeof value === 'object' ? (
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  String(value)
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-sm">{String(content)}</p>;
  };

  return (
    <Card className="border-blue-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Modifications en attente
          </CardTitle>
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            {pendingMods.length} en attente
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {pendingMods.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Aucune modification en attente</p>
            <p className="text-sm text-muted-foreground mt-2">
              Toutes les modifications ont été traitées
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingMods.map((mod) => (
              <Card key={mod.id} className="border-blue-100 bg-gradient-to-r from-white to-blue-50">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-blue-600">{mod.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 flex-wrap">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">{mod.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{mod.users?.username}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDistanceToNow(new Date(mod.created_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-orange-50 text-orange-600 border-orange-200">
                          {mod.status}
                        </Badge>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                          {typeof mod.content === 'string'
                            ? mod.content
                            : mod.content?.text || JSON.stringify(mod.content)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onReview(mod.id, 'approved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => onReview(mod.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => setSelected(mod)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-blue-600">{selected?.title}</DialogTitle>
            <DialogDescription>
              Détails complets de la modification en attente
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Type :</span>
                    <Badge variant="outline">{selected.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-50 text-orange-600 border-orange-200">
                      {selected.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Auteur :</span>
                    <span>{selected.users?.username || 'Inconnu'}</span>
                  </div>
                  {selected.users?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{selected.users.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Soumis le :</span>
                    <span>
                      {format(new Date(selected.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <div className="sm:col-span-2 text-xs text-muted-foreground">
                    ID : <code className="bg-muted px-1 py-0.5 rounded">{selected.id}</code>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                    Contenu
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    {renderContent(selected.content)}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {selected && (
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                onClick={() => {
                  onReview(selected.id, 'rejected');
                  setSelected(null);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  onReview(selected.id, 'approved');
                  setSelected(null);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approuver
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
