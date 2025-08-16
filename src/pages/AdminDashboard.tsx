import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Clock,
  FileText, 
  Shield, 
  Settings,
  Database,
  BarChart3,
  Users,
  Zap,
  FolderOpen,
  Lock
} from 'lucide-react';

import AdminStats from '@/components/admin/AdminStats';
import PendingModificationsSection from '@/components/admin/PendingModificationsSection';
import UserManagementSection from '@/components/admin/UserManagementSection';
import AdminActionsSection from '@/components/admin/AdminActionsSection';
import SiteControlSection from '@/components/admin/SiteControlSection';
import ContentManagementSection from '@/components/admin/ContentManagementSection';
import SystemAnalyticsSection from '@/components/admin/SystemAnalyticsSection';
import MediaManagementSection from '@/components/admin/MediaManagementSection';
import SecuritySection from '@/components/admin/SecuritySection';

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
      const promises = [fetchPendingModifications()];
      
      if (isAdmin()) {
        promises.push(fetchUsers());
        promises.push(fetchAdminActions());
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingModifications = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_modifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending modifications:', error);
        setPendingMods([]); // Set empty array on error
        return;
      }
      
      // Fetch user details separately
      const modsWithUsers = await Promise.all(
        (data || []).map(async (mod) => {
          const { data: userData } = await supabase
            .from('users')
            .select('username, email')
            .eq('id', mod.submitted_by)
            .maybeSingle(); // Use maybeSingle to avoid errors if user not found
          
          return {
            ...mod,
            users: userData || { username: 'Utilisateur supprimé', email: 'N/A' }
          };
        })
      );
      
      setPendingMods(modsWithUsers as any);
    } catch (error) {
      console.error('Error in fetchPendingModifications:', error);
      setPendingMods([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
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
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      setUsers([]);
    }
  };

  const fetchAdminActions = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching admin actions:', error);
        setAdminActions([]);
        return;
      }
      
      // Fetch user details separately
      const actionsWithUsers = await Promise.all(
        (data || []).map(async (action) => {
          const { data: userData } = await supabase
            .from('users')
            .select('username, email')
            .eq('id', action.admin_id)
            .maybeSingle(); // Use maybeSingle to avoid errors
          
          return {
            ...action,
            users: userData || { username: 'Utilisateur supprimé', email: 'N/A' }
          };
        })
      );
      
      setAdminActions(actionsWithUsers as any);
    } catch (error) {
      console.error('Error in fetchAdminActions:', error);
      setAdminActions([]);
    }
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

  // Calculate stats for the stats component
  const getStats = () => {
    return {
      userCount: users.length,
      pendingModifications: pendingMods.filter(mod => mod.status === 'pending').length,
      approvedModifications: pendingMods.filter(mod => mod.status === 'approved').length,
      rejectedModifications: pendingMods.filter(mod => mod.status === 'rejected').length,
      adminActions: adminActions.length
    };
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
    <div className="min-h-screen bg-white">
      <Header currentLanguage="fr" onLanguageChange={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Enhanced Header Section */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Tableau de bord {isAdmin() ? 'Administrateur' : 'Modérateur'}
              </h1>
              <p className="text-slate-600 text-lg mt-2">
                Contrôle total sur les utilisateurs, le contenu et le système
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm text-slate-600">Rôle actuel:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {isAdmin() ? 'Administrateur' : 'Modérateur'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          {isAdmin() && (
            <AdminStats {...getStats()} />
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 bg-white border border-blue-200">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Contenu</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Médias</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Modifications</span>
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Soumettre</span>
            </TabsTrigger>
            {isAdmin() && (
              <>
                <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Utilisateurs</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Sécurité</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Système</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analyses</span>
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Journal</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PendingModificationsSection 
                modifications={pendingMods} 
                onReview={handleModificationReview}
              />
              <AdminActionsSection actions={adminActions.slice(0, 5)} />
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <ContentManagementSection />
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <MediaManagementSection />
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <PendingModificationsSection 
              modifications={pendingMods} 
              onReview={handleModificationReview}
            />
          </TabsContent>

          <TabsContent value="submit" className="space-y-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-8 shadow-lg">
                <div className="text-center mb-6">
                  <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-blue-600 mb-2">
                    Soumettre une nouvelle modification
                  </h2>
                  <p className="text-slate-600">
                    Proposez des modifications qui seront examinées par l'équipe
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium text-slate-700">Type de modification</Label>
                    <Select value={newModType} onValueChange={setNewModType}>
                      <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500 mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">📢 Annonce</SelectItem>
                        <SelectItem value="content_update">📝 Mise à jour contenu</SelectItem>
                        <SelectItem value="policy_change">⚖️ Changement politique</SelectItem>
                        <SelectItem value="feature_request">✨ Demande de fonctionnalité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-slate-700">Titre</Label>
                    <Input
                      id="title"
                      value={newModTitle}
                      onChange={(e) => setNewModTitle(e.target.value)}
                      placeholder="Titre de la modification..."
                      className="border-blue-200 bg-white focus:ring-blue-500 mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content" className="text-sm font-medium text-slate-700">Contenu détaillé</Label>
                    <Textarea
                      id="content"
                      value={newModContent}
                      onChange={(e) => setNewModContent(e.target.value)}
                      placeholder="Décrivez en détail la modification souhaitée..."
                      rows={8}
                      className="border-blue-200 bg-white focus:ring-blue-500 mt-2"
                    />
                  </div>
                  
                  <Button 
                    onClick={submitModification}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    size="lg"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Soumettre pour approbation
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {isAdmin() && (
            <>
              <TabsContent value="users" className="space-y-4">
                <UserManagementSection
                  users={users}
                  selectedUser={selectedUser}
                  selectedRole={selectedRole}
                  onUserSelect={setSelectedUser}
                  onRoleSelect={setSelectedRole}
                  onRoleAssign={handleRoleAssignment}
                />
              </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <SiteControlSection />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <SecuritySection />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <SystemAnalyticsSection />
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <AdminActionsSection actions={adminActions} />
            </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}