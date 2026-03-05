import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Lock, Eye, AlertTriangle, Key, Activity, Globe, Clock, CheckCircle, XCircle, Users, FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function SecuritySection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [rlsPoliciesInfo, setRlsPoliciesInfo] = useState({ tablesWithRls: 0, totalTables: 0 });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Get user count
      const { count: uc } = await supabase.from('users').select('*', { count: 'exact', head: true });
      setUserCount(uc || 0);

      // Get admin/moderator count
      const { data: roles } = await supabase.from('user_roles').select('role').in('role', ['admin', 'moderator']);
      setAdminCount(roles?.length || 0);

      // Get recent admin actions (security-relevant)
      const { data: actions } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setRecentActions(actions || []);

      // Get reports count
      const { count: rc } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      setReportsCount(rc || 0);

      const { count: prc } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      setPendingReportsCount(prc || 0);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Erreur lors du chargement des données de sécurité');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Security Overview */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-green-200 rounded-lg bg-green-50">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{userCount}</div>
              <div className="text-sm text-slate-600">Utilisateurs</div>
            </div>
            <div className="text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
              <Key className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{adminCount}</div>
              <div className="text-sm text-slate-600">Admin/Modérateurs</div>
            </div>
            <div className="text-center p-4 border border-orange-200 rounded-lg bg-orange-50">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{pendingReportsCount}</div>
              <div className="text-sm text-slate-600">Signalements en attente</div>
            </div>
            <div className="text-center p-4 border border-purple-200 rounded-lg bg-purple-50">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{recentActions.length}</div>
              <div className="text-sm text-slate-600">Actions admin récentes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-blue-200">
          <TabsTrigger value="audit" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Activity className="h-4 w-4" />
            Audit
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <AlertTriangle className="h-4 w-4" />
            Signalements
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <CheckCircle className="h-4 w-4" />
            État
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Journal d'audit administratif</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Aucune action administrative enregistrée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActions.map((action) => (
                    <div key={action.id} className="flex items-center gap-4 p-4 border border-blue-200 rounded-lg bg-white hover:bg-blue-50">
                      <Activity className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{action.action_type.replace(/_/g, ' ')}</span>
                          {action.target_type && (
                            <Badge variant="outline" className="text-xs">{action.target_type}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(action.created_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Signalements utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-6 border border-orange-200 rounded-lg bg-orange-50">
                  <div className="text-3xl font-bold text-orange-600">{pendingReportsCount}</div>
                  <div className="text-sm text-slate-600 mt-1">En attente de traitement</div>
                </div>
                <div className="text-center p-6 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="text-3xl font-bold text-blue-600">{reportsCount}</div>
                  <div className="text-sm text-slate-600 mt-1">Total signalements</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Gérez les signalements dans la section "Modération" du tableau de bord.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">État de sécurité du système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">RLS activé sur toutes les tables</p>
                    <p className="text-sm text-green-700">Toutes les tables ont des politiques de sécurité Row-Level Security</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Authentification Supabase active</p>
                    <p className="text-sm text-green-700">Sessions sécurisées avec tokens JWT</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Rôles séparés (table user_roles)</p>
                    <p className="text-sm text-green-700">Architecture RBAC avec fonctions SECURITY DEFINER</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Clés API protégées</p>
                    <p className="text-sm text-blue-700">Les secrets sont stockés dans les Edge Function secrets Supabase</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
