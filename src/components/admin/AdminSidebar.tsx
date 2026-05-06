import { useState } from 'react';
import { 
  BarChart3, Home, FileText, Clock, Users, Image, Settings,
  Shield, Activity, Bell, Database, ChevronRight, Crown,
  UserCheck, DollarSign, Calendar, Brain, Menu, X, Search, Briefcase, Globe, Building2, BadgeCheck, Car, Tag, Code
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isAdmin: boolean;
  isModerator: boolean;
  userRole: string;
}

export default function AdminSidebar({ 
  activeSection, onSectionChange, isAdmin, isModerator, userRole 
}: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'overview', title: 'Vue d\'ensemble', icon: Home, description: 'Tableau de bord principal', available: true, category: 'dashboard' },
    { id: 'stats', title: 'Statistiques', icon: Activity, description: 'Métriques détaillées', available: true, category: 'dashboard' },
    { id: 'homepage', title: 'Page d\'accueil', icon: Settings, description: 'Gestion du contenu principal', available: true, category: 'content' },
    { id: 'content', title: 'Contenu', icon: FileText, description: 'Articles et publications', available: true, category: 'content' },
    { id: 'events', title: 'Événements', icon: Calendar, description: 'Gestion des événements', available: isAdmin || isModerator, category: 'content' },
    { id: 'tourism', title: 'Tourisme', icon: Database, description: 'Gastronomie & hébergements', available: isAdmin, category: 'content' },
    { id: 'infos-pratiques', title: 'Infos Pratiques', icon: Car, description: 'Taxis & Pharmacies de garde', available: isAdmin, category: 'content' },
    { id: 'ads', title: 'Publicités', icon: Crown, description: 'Espaces publicitaires', available: isAdmin, category: 'content' },
    { id: 'ad-stats', title: 'Stats Publicités', icon: BarChart3, description: 'Statistiques CTR', available: isAdmin, category: 'content' },
    { id: 'prices', title: 'Prix & Marchés', icon: DollarSign, description: 'Gestion des prix', available: isModerator || isAdmin, category: 'content' },
    { id: 'moderation', title: 'Modération', icon: UserCheck, description: 'Signalements et attente', available: isModerator || isAdmin, category: 'content' },
    { id: 'freelance', title: 'Freelance', icon: Briefcase, description: 'Missions et candidatures', available: isAdmin, category: 'content' },
    { id: 'diaspora', title: 'Diaspora', icon: Globe, description: 'Projets d\'investissement', available: isAdmin, category: 'content' },
    { id: 'carriers', title: 'Porteurs de projet', icon: UserCheck, description: 'Vérification des porteurs', available: isAdmin, category: 'content' },
    { id: 'verifications', title: 'Vérifications', icon: BadgeCheck, description: 'Demandes de vérification', available: isAdmin || isModerator, category: 'management' },
    { id: 'enterprises', title: 'Entreprises', icon: Building2, description: 'Profils entreprises', available: isAdmin, category: 'management' },
    { id: 'pending', title: 'Modifications', icon: Clock, description: 'En attente de validation', available: true, category: 'content' },
    { id: 'media', title: 'Médias', icon: Image, description: 'Images et fichiers', available: isModerator || isAdmin, category: 'content' },
    { id: 'static-pages', title: 'Pages statiques', icon: FileText, description: 'Contact, À propos...', available: isAdmin, category: 'content' },
    { id: 'users', title: 'Utilisateurs', icon: Users, description: 'Gestion des comptes', available: isAdmin, category: 'management' },
    { id: 'pro-subscriptions', title: 'Abonnements Pro', icon: Crown, description: 'Demandes d\'abonnement', available: isAdmin, category: 'management' },
    { id: 'promo-codes', title: 'Codes Promo', icon: Tag, description: 'Réductions personnalisables', available: isAdmin, category: 'management' },
    { id: 'site-control', title: 'Contrôle du site', icon: Settings, description: 'Paramètres globaux', available: isAdmin, category: 'management' },
    { id: 'security', title: 'Sécurité', icon: Shield, description: 'Logs et permissions', available: isAdmin, category: 'management' },
    { id: 'analytics', title: 'Analytiques', icon: BarChart3, description: 'Statistiques avancées', available: isAdmin, category: 'management' },
    { id: 'seo', title: 'SEO & Réseaux sociaux', icon: Search, description: 'Référencement et partage', available: isAdmin, category: 'management' },
    { id: 'actions', title: 'Journal d\'actions', icon: Bell, description: 'Historique des actions', available: isAdmin, category: 'monitoring' },
    { id: 'ai-analytics', title: 'Analyse IA', icon: Brain, description: 'Requêtes IA & tendances', available: isAdmin, category: 'monitoring' },
    { id: 'ai-knowledge', title: 'Sources IA', icon: Brain, description: 'Liens et sources de l\'IA', available: isAdmin, category: 'monitoring' },
    { id: 'api-dev', title: 'API & Développeurs', icon: Code, description: 'Clés API mobile', available: isAdmin, category: 'monitoring' },
    { id: 'push-subs', title: 'Abonnements Push', icon: Bell, description: 'Web / iOS / Android par utilisateur', available: isAdmin, category: 'monitoring' },
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

  const handleSectionChange = (id: string) => {
    onSectionChange(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
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
      <nav className="p-3 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(item => item.category === category && item.available);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3 px-2">
                {getCategory(category)}
              </h3>
              <div className="space-y-1">
                {categoryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionChange(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                        <div className="text-left min-w-0">
                          <div className={`font-medium text-sm sm:text-base truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                            {item.title}
                          </div>
                          <div className={`text-xs truncate hidden sm:block ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${
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
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden fixed bottom-4 left-4 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px] flex flex-col">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-80 bg-white border-r border-slate-200 shadow-sm flex-col">
        {sidebarContent}
      </div>
    </>
  );
}
