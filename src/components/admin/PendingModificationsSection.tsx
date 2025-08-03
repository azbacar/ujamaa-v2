import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
  onReview 
}: PendingModificationsSectionProps) {
  const pendingMods = modifications.filter(mod => mod.status === 'pending');
  
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
            <p className="text-muted-foreground text-lg">
              Aucune modification en attente
            </p>
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
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
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
                                  locale: fr
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
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {mod.content.text}
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
    </Card>
  );
}