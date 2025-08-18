
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Import admin components
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminStats from '@/components/admin/AdminStats';
import AdminActionsSection from '@/components/admin/AdminActionsSection';
import PendingModificationsSection from '@/components/admin/PendingModificationsSection';
import ContentManagementSection from '@/components/admin/ContentManagementSection';
import UserManagementSection from '@/components/admin/UserManagementSection';
import MediaManagementSection from '@/components/admin/MediaManagementSection';
import SiteControlSection from '@/components/admin/SiteControlSection';
import SecuritySection from '@/components/admin/SecuritySection';
import SystemAnalyticsSection from '@/components/admin/SystemAnalyticsSection';
import { HomepageManagementSection } from '@/components/admin/HomepageManagementSection';

interface PendingModification {
  id: string;
  type: string;
  title: string;
  status: string;
  created_at: string;
  content: any;
  submitted_by: string;
  users?: { username: string; email: string } | null;
}

interface AdminAction {
  id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  description: string;
  created_at: string;
  users?: { username: string; email: string } | null;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { role, loading: roleLoading, isAdmin, isModerator } = useRole();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState('overview');
  const [pendingMods, setPendingMods] = useState<PendingModification[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');

  useEffect(() => {
    if (roleLoading) return;
    
    if (!user || (!isAdmin() && !isModerator())) {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, roleLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending modifications
      const { data: modsData } = await supabase
        .from('pending_modifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      setPendingMods(modsData || []);

      // Fetch admin actions
      if (isAdmin()) {
        const { data: actionsData } = await supabase
          .from('admin_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        setAdminActions(actionsData || []);

        // Fetch users
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        setUsers(usersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleModificationReview = async (modId: string, action: 'approved' | 'rejected', notes?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('pending_modifications')
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null
        })
        .eq('id', modId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        _action_type: 'modification_review',
        _target_type: 'pending_modification',
        _target_id: modId,
        _description: `Modification ${action} par ${user.email}`
      });

      toast.success(`Modification ${action === 'approved' ? 'approuvée' : 'rejetée'}`);
      fetchData();
    } catch (error) {
      console.error('Error reviewing modification:', error);
      toast.error('Erreur lors de la révision');
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-lg font-medium text-slate-700">Chargement de votre profil...</div>
        </div>
      </div>
    );
  }

  if (!user || (!isAdmin() && !isModerator())) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="text-xl font-semibold text-red-600">Accès non autorisé</div>
          <p className="text-slate-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview 
          userCount={users.length}
          pendingModifications={pendingMods.filter(m => m.status === 'pending').length}
          recentActions={adminActions.slice(0, 5)}
          totalModifications={pendingMods.length}
        />;
      
      case 'stats':
        return <AdminStats 
          userCount={users.length}
          pendingModifications={pendingMods.filter(m => m.status === 'pending').length}
          approvedModifications={pendingMods.filter(m => m.status === 'approved').length}
          rejectedModifications={pendingMods.filter(m => m.status === 'rejected').length}
          adminActions={adminActions.length}
        />;
      
      case 'homepage':
        return <HomepageManagementSection />;
      
      case 'content':
        return <ContentManagementSection />;
      
      case 'pending':
        return <PendingModificationsSection 
          modifications={pendingMods}
          onReview={handleModificationReview}
        />;
      
      case 'users':
        return <UserManagementSection 
          users={users}
          selectedUser={selectedUser}
          selectedRole={selectedRole}
          onUserSelect={setSelectedUser}
          onRoleSelect={setSelectedRole}
          onRoleAssign={() => {
            // Handle role assignment
            toast.success('Rôle assigné avec succès');
            fetchData();
          }}
        />;
      
      case 'media':
        return <MediaManagementSection />;
      
      case 'site-control':
        return <SiteControlSection />;
      
      case 'security':
        return <SecuritySection />;
      
      case 'analytics':
        return <SystemAnalyticsSection />;
      
      case 'actions':
        return <AdminActionsSection actions={adminActions} />;
      
      default:
        return <AdminOverview 
          userCount={users.length}
          pendingModifications={pendingMods.filter(m => m.status === 'pending').length}
          recentActions={adminActions.slice(0, 5)}
          totalModifications={pendingMods.length}
        />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header currentLanguage="fr" onLanguageChange={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div className="text-lg font-medium text-slate-700">Chargement des données...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentLanguage="fr" onLanguageChange={() => {}} />
      
      <div className="flex min-h-screen">
        <AdminSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isAdmin={isAdmin()}
          isModerator={isModerator()}
          userRole={role}
        />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Tableau de bord {isAdmin() ? 'Administrateur' : 'Modérateur'}
                  </h1>
                  <p className="text-slate-600 mt-2">
                    Gérez votre site web et ses utilisateurs depuis cette interface
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{user.email}</p>
                    <p className="text-xs text-slate-500 capitalize">{role}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
