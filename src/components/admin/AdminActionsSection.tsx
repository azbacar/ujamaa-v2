import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Clock,
  User,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AdminAction {
  id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  description: string;
  created_at: string;
  users: { username: string; email: string };
}

interface AdminActionsSectionProps {
  actions: AdminAction[];
}

export default function AdminActionsSection({ actions }: AdminActionsSectionProps) {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'role_assignment': return Shield;
      case 'modification_review': return Activity;
      default: return Shield;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'role_assignment': return 'admin-primary';
      case 'modification_review': return 'admin-secondary';
      default: return 'admin-accent';
    }
  };

  return (
    <Card className="border-admin-border bg-admin-surface">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-admin-primary flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Journal des actions administratives
          </CardTitle>
          <Badge variant="outline" className="text-admin-accent border-admin-accent/20">
            {actions.length} actions récentes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Aucune action administrative
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Les actions futures apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((action) => {
              const Icon = getActionIcon(action.action_type);
              const color = getActionColor(action.action_type);
              
              return (
                <Card key={action.id} className="border-admin-border/50 bg-gradient-to-r from-admin-surface to-admin-surface-hover">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full bg-${color}/10 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 text-${color}`} />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">{action.action_type.replace('_', ' ')}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{action.users.username}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatDistanceToNow(new Date(action.created_at), {
                                    addSuffix: true,
                                    locale: fr
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge className={`bg-${color}/10 text-${color} border-${color}/20`}>
                            {action.target_type || 'système'}
                          </Badge>
                        </div>
                        
                        <div className="bg-admin-surface-hover p-3 rounded-lg border border-admin-border/30">
                          <p className="text-sm text-foreground">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}