import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Settings,
  Users,
  FileText,
  Home,
  Shield,
  BarChart3,
  Clock,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

interface PendingModification {
  id: string;
  type: string;
  title: string;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { role, loading: roleLoading, isAdmin, isModerator } = useRole();
  const navigate = useNavigate();
  
  const [pendingMods, setPendingMods] = useState<PendingModification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

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

      // Fetch users if admin
      if (isAdmin()) {
        const { data: usersData } = await supabase
          .from('users')
          .select('*');
        
        setUsers(usersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
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

  if (!user || (!isAdmin() && !isModerator())) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Accès non autorisé</div>
      </div>
    );
  }

  const menuItems = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble',
      icon: BarChart3,
      description: 'Statistiques générales',
      available: true
    },
    {
      id: 'homepage',
      title: 'Gestion Page d\'accueil',
      icon: Home,
      description: 'Modifier le contenu de la page d\'accueil',
      available: true
    },
    {
      id: 'content',
      title: 'Gestion du contenu',
      icon: FileText,
      description: 'Créer et modifier le contenu',
      available: true
    },
    {
      id: 'pending',
      title: 'Modifications en attente',
      icon: Clock,
      description: `${pendingMods.filter(m => m.status === 'pending').length} en attente`,
      available: true
    },
    {
      id: 'users',
      title: 'Gestion utilisateurs',
      icon: Users,
      description: 'Gérer les rôles et permissions',
      available: isAdmin()
    },
    {
      id: 'settings',
      title: 'Paramètres système',
      icon: Settings,
      description: 'Configuration générale',
      available: isAdmin()
    },
    {
      id: 'security',
      title: 'Sécurité',
      icon: Shield,
      description: 'Gestion de la sécurité',
      available: isAdmin()
    },
    {
      id: 'database',
      title: 'Base de données',
      icon: Database,
      description: 'Gestion de la base de données',
      available: isAdmin()
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Modifications en attente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {pendingMods.filter(m => m.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Modifications approuvées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {pendingMods.filter(m => m.status === 'approved').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Votre rôle</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={isAdmin() ? "default" : "secondary"}>
                    {isAdmin() ? 'Administrateur' : 'Modérateur'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Dernières modifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingMods.slice(0, 5).map((mod) => (
                    <div key={mod.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{mod.title}</h4>
                        <p className="text-sm text-gray-500">{mod.type}</p>
                      </div>
                      <Badge variant={
                        mod.status === 'approved' ? 'default' : 
                        mod.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {mod.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'homepage':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Gestion de la page d'accueil</CardTitle>
              <CardDescription>
                Modifiez le contenu et l'apparence de la page d'accueil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Section Hero</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Modifier le contenu principal</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Catégories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Gérer les catégories</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Annonces</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Créer une annonce</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Configurer les actions</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'users':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>
                Gérez les rôles et permissions des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{user.username}</h4>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Button variant="outline">Gérer les rôles</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
        
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Section en développement</CardTitle>
              <CardDescription>
                Cette section sera bientôt disponible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Contenu à venir...</p>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentLanguage="fr" onLanguageChange={() => {}} />
        <main className="container mx-auto px-4 py-8">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentLanguage="fr" onLanguageChange={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord {isAdmin() ? 'Administrateur' : 'Modérateur'}
          </h1>
          <p className="text-gray-600">
            Gérez votre site web et ses utilisateurs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Menu de gestion</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {menuItems.filter(item => item.available).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          activeSection === item.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}