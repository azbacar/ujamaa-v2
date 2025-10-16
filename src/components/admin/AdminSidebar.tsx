
import { 
  BarChart3,
  Home,
  FileText,
  Clock,
  Users,
  Image,
  Settings,
  Shield,
  Activity,
  Bell,
  Database,
  ChevronRight,
  Crown,
  UserCheck,
  DollarSign,
  UtensilsCrossed
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isAdmin: boolean;
  isModerator: boolean;
  userRole: string;
}

export default function AdminSidebar({ 
  activeSection, 
  onSectionChange, 
  isAdmin, 
  isModerator, 
  userRole 
}: AdminSidebarProps) {
  const menuItems = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble',
      icon: BarChart3,
      description: 'Tableau de bord principal',
      available: true,
      category: 'dashboard'
    },
    {
      id: 'stats',
      title: 'Statistiques',
      icon: Activity,
      description: 'Métriques détaillées',
      available: true,
      category: 'dashboard'
    },
    {
      id: 'homepage',
      title: 'Page d\'accueil',
      icon: Home,
      description: 'Gestion du contenu principal',
      available: true,
      category: 'content'
    },
    {
      id: 'content',
      title: 'Contenu',
      icon: FileText,
      description: 'Articles et publications',
      available: true,
      category: 'content'
    },
    {
      id: 'tourism',
      title: 'Tourisme',
      icon: UtensilsCrossed,
      description: 'Restaurants, hôtels, hébergements',
      available: isAdmin || isModerator,
      category: 'content'
    },
    {
      id: 'ads',
      title: 'Publicités',
      icon: BarChart3,
      description: 'Gestion des espaces publicitaires',
      available: isAdmin,
      category: 'content'
    },
    {
      id: 'prices',
      title: 'Prix & Marchés',
      icon: DollarSign,
      description: 'Gestion des prix soumis',
      available: isModerator || isAdmin,
      category: 'content'
    },
    {
      id: 'pending',
      title: 'Modifications',
      icon: Clock,
      description: 'En attente de validation',
      available: true,
      category: 'content'
    },
    {
      id: 'media',
      title: 'Médias',
      icon: Image,
      description: 'Images et fichiers',
      available: isModerator || isAdmin,
      category: 'content'
    },
    {
      id: 'users',
      title: 'Utilisateurs',
      icon: Users,
      description: 'Gestion des comptes',
      available: isAdmin,
      category: 'management'
    },
    {
      id: 'site-control',
      title: 'Contrôle du site',
      icon: Database,
      description: 'Paramètres globaux',
      available: isAdmin,
      category: 'management'
    },
    {
      id: 'security',
      title: 'Sécurité',
      icon: Shield,
      description: 'Logs et permissions',
      available: isAdmin,
      category: 'management'
    },
    {
      id: 'analytics',
      title: 'Analytiques',
      icon: BarChart3,
      description: 'Statistiques avancées',
      available: isAdmin,
      category: 'management'
    },
    {
      id: 'actions',
      title: 'Journal d\'actions',
      icon: Bell,
      description: 'Historique des actions',
      available: isAdmin,
      category: 'monitoring'
    }
  ];

  const getCategory = (category: string) => {
    switch(category) {
      case 'dashboard': return 'Tableau de bord';
      case 'content': return 'Gestion du contenu';
      case 'management': return 'Administration';
      case 'monitoring': return 'Surveillance';
      default: return 'Autres';
    }
  };

  const categories = ['dashboard', 'content', 'management', 'monitoring'];

  return (
    <div className="w-80 bg-white border-r border-slate-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            {isAdmin ? <Crown className="h-5 w-5 text-white" /> : <UserCheck className="h-5 w-5 text-white" />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Administration</h2>
            <Badge 
              variant="outline" 
              className={`text-xs ${isAdmin ? 'border-purple-200 text-purple-700 bg-purple-50' : 'border-blue-200 text-blue-700 bg-blue-50'}`}
            >
              {isAdmin ? 'Administrateur' : 'Modérateur'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(item => item.category === category && item.available);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                {getCategory(category)}
              </h3>
              <div className="space-y-1">
                {categoryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSectionChange(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                        <div className="text-left">
                          <div className={`font-medium ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {item.title}
                          </div>
                          <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        isActive ? 'text-white rotate-90' : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

    </div>
  );
}
