import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, CheckCircle2, XCircle, UserCheck, Building2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProjectCarrier {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  phone: string | null;
  email: string | null;
  island: string | null;
  location: string | null;
  organization: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export default function CarrierManagementSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<ProjectCarrier | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: carriers, isLoading } = useQuery({
    queryKey: ['admin-project-carriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_carriers' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ProjectCarrier[];
    },
  });

  const toggleVerified = useMutation({
    mutationFn: async ({ id, is_verified }: { id: string; is_verified: boolean }) => {
      const { error } = await supabase
        .from('project_carriers' as any)
        .update({ is_verified })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { is_verified }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-project-carriers'] });
      toast.success(is_verified ? 'Porteur vérifié ✅' : 'Vérification retirée');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('project_carriers' as any)
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-project-carriers'] });
      toast.success(is_active ? 'Profil activé' : 'Profil désactivé');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const filtered = carriers?.filter(c =>
    !search ||
    c.display_name.toLowerCase().includes(search.toLowerCase()) ||
    c.organization?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: carriers?.length || 0,
    verified: carriers?.filter(c => c.is_verified).length || 0,
    active: carriers?.filter(c => c.is_active).length || 0,
    pending: carriers?.filter(c => !c.is_verified && c.is_active).length || 0,
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">👤 Porteurs de Projet</h2>
        <p className="text-slate-600 text-sm mt-1">Vérifiez et gérez les profils des porteurs de projet diaspora</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
            <p className="text-xs text-muted-foreground">Vérifiés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, organisation, email..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Chargement...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Porteur</TableHead>
                <TableHead className="hidden md:table-cell">Organisation</TableHead>
                <TableHead className="hidden sm:table-cell">Île</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun porteur de projet trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map(carrier => (
                  <TableRow key={carrier.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{carrier.display_name}</p>
                        <p className="text-xs text-muted-foreground">{carrier.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {carrier.organization || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {carrier.island || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {carrier.is_verified ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs w-fit">✅ Vérifié</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs w-fit">⏳ Non vérifié</Badge>
                        )}
                        {!carrier.is_active && (
                          <Badge variant="destructive" className="text-xs w-fit">Désactivé</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setSelectedCarrier(carrier); setShowDetail(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleVerified.mutate({ id: carrier.id, is_verified: !carrier.is_verified })}
                        >
                          {carrier.is_verified ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => toggleActive.mutate({ id: carrier.id, is_active: !carrier.is_active })}
                        >
                          {carrier.is_active ? 'Désactiver' : 'Activer'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {selectedCarrier?.display_name}
            </DialogTitle>
            <DialogDescription>Détails du profil porteur de projet</DialogDescription>
          </DialogHeader>
          {selectedCarrier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedCarrier.email || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{selectedCarrier.phone || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organisation</Label>
                  <p className="font-medium">{selectedCarrier.organization || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Île</Label>
                  <p className="font-medium">{selectedCarrier.island || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Localité</Label>
                  <p className="font-medium">{selectedCarrier.location || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Inscrit le</Label>
                  <p className="font-medium">{new Date(selectedCarrier.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              {selectedCarrier.bio && (
                <div>
                  <Label className="text-muted-foreground">Présentation</Label>
                  <p className="text-sm mt-1 bg-muted p-3 rounded-lg">{selectedCarrier.bio}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Badge className={selectedCarrier.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {selectedCarrier.is_verified ? '✅ Vérifié' : '⏳ Non vérifié'}
                </Badge>
                <Badge className={selectedCarrier.is_active ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}>
                  {selectedCarrier.is_active ? 'Actif' : 'Désactivé'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedCarrier && !selectedCarrier.is_verified && (
              <Button
                onClick={() => {
                  toggleVerified.mutate({ id: selectedCarrier.id, is_verified: true });
                  setShowDetail(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Vérifier ce porteur
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetail(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
