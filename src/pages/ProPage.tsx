import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Crown, 
  Zap, 
  Star, 
  Shield,
  TrendingUp,
  Users,
  BarChart3,
  Sparkles,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';

const ProPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const { user } = useAuth();
  const { role } = useRole();

  const plans = [
    {
      id: 'basic',
      name: 'UJAMAA Basic',
      price: '0 FC',
      period: '/mois',
      description: 'Accès aux fonctionnalités essentielles',
      features: [
        'Consultation des prix et marchés',
        'Annonces publiques',
        'Événements et actualités',
        'Support communautaire',
        'Application mobile de base'
      ],
      color: 'from-slate-500 to-slate-600',
      icon: Shield
    },
    {
      id: 'premium',
      name: 'UJAMAA Premium',
      price: '5,000 FC',
      period: '/mois',
      description: 'Pour les professionnels et entreprises',
      features: [
        'Toutes les fonctionnalités Basic',
        'Alertes personnalisées en temps réel',
        'Historique des prix détaillé',
        'Statistiques avancées',
        'Support prioritaire 24/7',
        'API d\'accès aux données',
        'Rapports personnalisés'
      ],
      color: 'from-emerald-500 to-ocean-500',
      icon: Star,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'UJAMAA Enterprise',
      price: 'Sur devis',
      period: '',
      description: 'Solutions personnalisées pour grandes organisations',
      features: [
        'Toutes les fonctionnalités Premium',
        'Intégration système personnalisée',
        'Formation équipe dédiée',
        'Tableau de bord personnalisé',
        'SLA garanti 99.9%',
        'Consultant dédié',
        'Déploiement on-premise possible'
      ],
      color: 'from-purple-500 to-pink-500',
      icon: Crown
    }
  ];

  const businessFeatures = [
    {
      icon: TrendingUp,
      title: 'Analyse Prédictive',
      description: 'IA avancée pour prévoir les tendances des prix et optimiser vos achats'
    },
    {
      icon: Users,
      title: 'Gestion d\'Équipe',
      description: 'Outils collaboratifs pour coordonner vos équipes sur le terrain'
    },
    {
      icon: BarChart3,
      title: 'Rapports Détaillés',
      description: 'Analyses approfondies et tableaux de bord personnalisables'
    },
    {
      icon: Sparkles,
      title: 'Automatisation',
      description: 'Workflows automatisés pour optimiser vos processus métier'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-ocean-100 px-4 py-2 rounded-full mb-6">
            <Crown className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">UJAMAA Pro</span>
          </div>
          
          <h1 className="text-5xl font-bold gradient-text mb-6">
            Débloquez tout le potentiel d'UJAMAA
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Accédez aux outils professionnels et données avancées pour optimiser 
            vos activités commerciales aux Comores
          </p>
          
          {user && (
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-md">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-ocean-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700">Connecté en tant que {user.email}</span>
              <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                {role === 'admin' ? 'Administrateur' : role === 'moderator' ? 'Modérateur' : 'Utilisateur'}
              </Badge>
            </div>
          )}
        </div>

        {/* Plans de prix */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Choisissez votre plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative feature-card cursor-pointer transition-all ${
                  selectedPlan === plan.id ? 'ring-2 ring-emerald-500 scale-105' : ''
                } ${plan.popular ? 'border-emerald-300' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white px-4 py-1">
                      ⭐ Populaire
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                  
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full mt-6 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-emerald-500 to-ocean-500 hover:from-emerald-600 hover:to-ocean-600' 
                        : 'bg-gray-800 hover:bg-gray-900'
                    }`}
                  >
                    {plan.id === 'basic' ? 'Gratuit' : plan.id === 'enterprise' ? 'Nous contacter' : 'Choisir ce plan'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Fonctionnalités Business */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Outils pour professionnels
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessFeatures.map((feature, index) => (
              <Card key={index} className="feature-card text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-ocean-500 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Formulaire de contact */}
        <Card className="glass-effect max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              <Zap className="w-6 h-6 inline mr-2" />
              Besoin d'informations ?
            </CardTitle>
            <p className="text-center text-gray-600">
              Notre équipe vous accompagne dans le choix de la solution adaptée
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nom complet</label>
                <Input placeholder="Votre nom" className="input-enhanced" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <Input placeholder="votre@email.com" type="email" className="input-enhanced" />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Entreprise/Organisation</label>
              <Input placeholder="Nom de votre entreprise" className="input-enhanced" />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Plan d'intérêt</label>
              <Select defaultValue={selectedPlan}>
                <SelectTrigger className="select-enhanced">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">UJAMAA Premium</SelectItem>
                  <SelectItem value="enterprise">UJAMAA Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
              <Textarea 
                placeholder="Décrivez vos besoins et questions..."
                className="input-enhanced min-h-[100px]"
              />
            </div>
            
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-ocean-500 hover:from-emerald-600 hover:to-ocean-600">
              Envoyer la demande
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProPage;