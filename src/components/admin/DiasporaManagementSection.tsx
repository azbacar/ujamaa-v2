import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Globe, CheckCircle, XCircle, Eye, TrendingUp } from 'lucide-react';
import type { DiasporaProject } from '@/hooks/useDiaspora';

export default function DiasporaManagementSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-diaspora-projects', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('diaspora_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as DiasporaProject[];
    },
  });

  const { data: investments } = useQuery({
    queryKey: ['admin-all-investments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_investments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const updateProjectStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('diaspora_projects')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: '❌ Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Statut mis à jour' });
      queryClient.invalidateQueries({ queryKey: ['admin-diaspora-projects'] });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-100 text-green-700">Publié</Badge>;
      case 'draft': return <Badge variant="secondary">Brouillon</Badge>;
      case 'funded': return <Badge className="bg-blue-100 text-blue-700">Financé</Badge>;
      case 'closed': return <Badge variant="destructive">Fermé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalInvested = investments?.reduce((sum, inv) => inv.status === 'confirmed' ? sum + Number(inv.amount) : sum, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="h-6 w-6 text-emerald-600" />
        <h2 className="text-2xl font-bold">Investissement Diaspora</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-emerald-600">{projects?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Projets total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{investments?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Investissements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-purple-600">
              <TrendingUp className="h-5 w-5 inline mr-1" />
              {new Intl.NumberFormat('fr-FR').format(totalInvested)} FC
            </p>
            <p className="text-sm text-muted-foreground">Montant confirmé</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
            <SelectItem value="funded">Financé</SelectItem>
            <SelectItem value="closed">Fermé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Projets</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-4 text-center">Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Cible</TableHead>
                    <TableHead>Collecté</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects?.map(project => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{project.title}</TableCell>
                      <TableCell>{project.category}</TableCell>
                      <TableCell>{new Intl.NumberFormat('fr-FR').format(project.target_amount)} {project.currency}</TableCell>
                      <TableCell>{new Intl.NumberFormat('fr-FR').format(project.current_amount)} {project.currency}</TableCell>
                      <TableCell>{statusBadge(project.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {project.status === 'draft' && (
                            <Button size="sm" variant="outline" className="text-green-600"
                              onClick={() => updateProjectStatus(project.id, 'published')}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Publier
                            </Button>
                          )}
                          {project.status === 'published' && (
                            <Button size="sm" variant="outline" className="text-red-600"
                              onClick={() => updateProjectStatus(project.id, 'closed')}>
                              <XCircle className="h-4 w-4 mr-1" /> Fermer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!projects || projects.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun projet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
