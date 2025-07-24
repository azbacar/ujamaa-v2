import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  FileText, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Crown,
  ShieldCheck,
  User
} from 'lucide-react';

interface PendingModification {
  id: string;
  type: string;
  title: string;
  content: any;
  submitted_by: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  users?: { username: string; email: string };
}

interface UserWithRole {
  id: string;
  email: string;
  username: string;
  user_roles: { role: string }[];
}

interface AdminAction {
  id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  description: string;
  created_at: string;
  users: { username: string; email: string };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { role, loading: roleLoading, isAdmin, isModerator } = useRole();
  const navigate = useNavigate();
  
  const [pendingMods, setPendingMods] = useState<PendingModification[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [newModTitle, setNewModTitle] = useState('');
  const [newModContent, setNewModContent] = useState('');
  const [newModType, setNewModType] = useState('announcement');

  useEffect(() => {
    if (roleLoading) return;
    
    if (!user || (!isAdmin() && !isModerator())) {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, roleLoading]); // Simplified dependencies to avoid loops

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPendingModifications(),
        isAdmin() && fetchUsers(),
        isAdmin() && fetchAdminActions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingModifications = async () => {
    const { data, error } = await supabase
      .from('pending_modifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending modifications:', error);
      return;
    }
    
    // Fetch user details separately
    const modsWithUsers = await Promise.all(
      (data || []).map(async (mod) => {
        const { data: userData } = await supabase
          .from('users')
          .select('username, email')
          .eq('id', mod.submitted_by)
          .single();
        
        return {
          ...mod,
          users: userData
        };
      })
    );
    
    setPendingMods(modsWithUsers as any);
  };

  const fetchUsers = async () => {
    const { data: usersData, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    // Fetch roles separately
    const usersWithRoles = await Promise.all(
      (usersData || []).map(async (user) => {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        return {
          ...user,
          user_roles: rolesData || []
        };
      })
    );
    
    setUsers(usersWithRoles as any);
  };

  const fetchAdminActions = async () => {
    const { data, error } = await supabase
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching admin actions:', error);
      return;
    }
    
    // Fetch user details separately
    const actionsWithUsers = await Promise.all(
      (data || []).map(async (action) => {
        const { data: userData } = await supabase
          .from('users')
          .select('username, email')
          .eq('id', action.admin_id)
          .single();
        
        return {
          ...action,
          users: userData || { username: 'Unknown', email: 'unknown@example.com' }
        };
      })
    );
    
    setAdminActions(actionsWithUsers as any);
  };

  const handleRoleAssignment = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Veuillez sélectionner un utilisateur et un rôle');
      return;
    }

    try {
      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', selectedUser)
        .eq('role', selectedRole as 'admin' | 'moderator' | 'user')
        .single();

      if (existingRole) {
        toast.error('L\'utilisateur a déjà ce rôle');
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser,
          role: selectedRole as 'admin' | 'moderator' | 'user',
          assigned_by: user?.id
        });

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        _action_type: 'role_assignment',
        _target_type: 'user',
        _target_id: selectedUser,
        _description: `Assigned role: ${selectedRole}`,
        _metadata: { role: selectedRole }
      });

      toast.success('Rôle assigné avec succès');
      setSelectedUser('');
      setSelectedRole('');
      fetchUsers();
      fetchAdminActions();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Erreur lors de l\'assignation du rôle');
    }
  };

  const handleModificationReview = async (modId: string, action: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('pending_modifications')
        .update({
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', modId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        _action_type: 'modification_review',
        _target_type: 'pending_modification',
        _target_id: modId,
        _description: `${action === 'approved' ? 'Approved' : 'Rejected'} modification`,
        _metadata: { action, notes }
      });

      toast.success(`Modification ${action === 'approved' ? 'approuvée' : 'rejetée'}`);
      fetchPendingModifications();
      fetchAdminActions();
    } catch (error) {
      console.error('Error reviewing modification:', error);
      toast.error('Erreur lors de la révision');
    }
  };

  const submitModification = async () => {
    if (!newModTitle || !newModContent) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const { error } = await supabase
        .from('pending_modifications')
        .insert({
          type: newModType,
          title: newModTitle,
          content: { text: newModContent },
          submitted_by: user?.id
        });

      if (error) throw error;

      toast.success('Modification soumise pour approbation');
      setNewModTitle('');
      setNewModContent('');
      setNewModType('announcement');
      fetchPendingModifications();
    } catch (error) {
      console.error('Error submitting modification:', error);
      toast.error('Erreur lors de la soumission');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'moderator': return <ShieldCheck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'moderator': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div>Chargement de votre profil...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <Header currentLanguage="fr" onLanguageChange={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Tableau de bord {isAdmin() ? 'Administrateur' : 'Modérateur'}
            </h1>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div>Chargement des données...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user || (!isAdmin() && !isModerator())) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Accès non autorisé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <Header currentLanguage="fr" onLanguageChange={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Tableau de bord {isAdmin() ? 'Administrateur' : 'Modérateur'}
          </h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, les modifications et le contenu du site
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Modifications en attente
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Soumettre modification
            </TabsTrigger>
            {isAdmin() && (
              <>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Gestion utilisateurs
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Journal d'actions
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Modifications en attente d'approbation</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingMods.filter(mod => mod.status === 'pending').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune modification en attente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingMods.filter(mod => mod.status === 'pending').map((mod) => (
                      <Card key={mod.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">{mod.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Type: {mod.type} • Soumis par: {mod.users?.username}
                              </p>
                            </div>
                            <Badge>{mod.status}</Badge>
                          </div>
                          <p className="mb-4">{mod.content.text}</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleModificationReview(mod.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approuver
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleModificationReview(mod.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeter
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Soumettre une nouvelle modification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="type">Type de modification</Label>
                  <Select value={newModType} onValueChange={setNewModType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Annonce</SelectItem>
                      <SelectItem value="content_update">Mise à jour contenu</SelectItem>
                      <SelectItem value="policy_change">Changement politique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={newModTitle}
                    onChange={(e) => setNewModTitle(e.target.value)}
                    placeholder="Titre de la modification"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Contenu</Label>
                  <Textarea
                    id="content"
                    value={newModContent}
                    onChange={(e) => setNewModContent(e.target.value)}
                    placeholder="Décrivez la modification..."
                    rows={6}
                  />
                </div>
                
                <Button onClick={submitModification}>
                  Soumettre pour approbation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin() && (
            <>
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestion des rôles utilisateurs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="user">Utilisateur</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un utilisateur" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.username} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="role">Rôle</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            <SelectItem value="moderator">Modérateur</SelectItem>
                            <SelectItem value="user">Utilisateur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button onClick={handleRoleAssignment}>
                      Assigner le rôle
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Liste des utilisateurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex gap-2">
                            {user.user_roles.map((roleData, index) => (
                              <Badge 
                                key={index} 
                                variant={getRoleBadgeVariant(roleData.role)}
                                className="flex items-center gap-1"
                              >
                                {getRoleIcon(roleData.role)}
                                {roleData.role}
                              </Badge>
                            ))}
                            {user.user_roles.length === 0 && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                user
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Journal des actions administratives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {adminActions.map((action) => (
                        <div key={action.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{action.action_type}</p>
                              <p className="text-sm text-muted-foreground">
                                Par: {action.users.username}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(action.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{action.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}