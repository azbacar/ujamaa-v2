import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useLanguage } from '@/components/LanguageProvider';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search, ShoppingCart, Calendar, Briefcase, Globe2, Users, Building2,
  UserPlus, ChevronDown, ChevronUp, MapPin, Bell, Star, Shield,
  ArrowRight, CheckCircle, Smartphone, MessageCircle, Crown, Compass
} from 'lucide-react';

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details?: string[];
}

function Step({ number, title, description, icon, details }: StepProps) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {number}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {icon}
              <h3 className="font-semibold text-foreground">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            {details && details.length > 0 && (
              <>
                <button
                  onClick={() => setOpen(!open)}
                  className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  {open ? 'Moins de détails' : 'Plus de détails'}
                  {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {open && (
                  <ul className="mt-2 space-y-1.5">
                    {details.map((d, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  color: string;
}

function FeatureCard({ icon, title, description, link, color }: FeatureCardProps) {
  const navigate = useNavigate();
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-border/50"
      onClick={() => navigate(link)}
    >
      <CardContent className="p-5 text-center space-y-3">
        <div className={`w-12 h-12 mx-auto rounded-xl ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
        <Button variant="ghost" size="sm" className="text-primary text-xs">
          Découvrir <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function GuidePage() {
  const navigate = useNavigate();

  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const features: FeatureCardProps[] = [
    { icon: <ShoppingCart className="h-6 w-6 text-emerald-600" />, title: 'Prix du marché', description: 'Consultez les prix en temps réel sur toutes les îles', link: '/prix', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { icon: <Calendar className="h-6 w-6 text-blue-600" />, title: 'Événements', description: 'Découvrez les événements à venir et inscrivez-vous', link: '/evenements', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { icon: <Briefcase className="h-6 w-6 text-purple-600" />, title: 'Appels d\'offres', description: 'Trouvez des marchés publics et soumissionnez', link: '/appels-offres', color: 'bg-purple-100 dark:bg-purple-900/30' },
    { icon: <Users className="h-6 w-6 text-orange-600" />, title: 'Freelance', description: 'Trouvez des missions ou des talents comoriens', link: '/freelance', color: 'bg-orange-100 dark:bg-orange-900/30' },
    { icon: <Globe2 className="h-6 w-6 text-teal-600" />, title: 'Diaspora', description: 'Investissez dans des projets aux Comores', link: '/investissement', color: 'bg-teal-100 dark:bg-teal-900/30' },
    { icon: <Building2 className="h-6 w-6 text-indigo-600" />, title: 'Entreprises', description: 'Gérez votre entreprise avec le CRM intégré', link: '/entreprise', color: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { icon: <Compass className="h-6 w-6 text-rose-600" />, title: 'Tourisme', description: 'Explorez les merveilles des Comores', link: '/tourisme', color: 'bg-rose-100 dark:bg-rose-900/30' },
    { icon: <MapPin className="h-6 w-6 text-amber-600" />, title: 'Infos pratiques', description: 'Pharmacies de garde, tarifs taxi et plus', link: '/infos-pratiques', color: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE1aDRWMGg0djE1aDRWMGg0djE1aDRWMGg0djE1aDR2NGgtNHY0aC00di00aC00djRoLTR2LTRoLTR2NGgtNHYtNGgtNHYtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            📖 Guide d'utilisation
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
            Bienvenue sur <span className="text-emerald-200">Ujamaan</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            La plateforme tout-en-un pour les Comores. Découvrez comment utiliser chaque fonctionnalité pour tirer le meilleur parti d'Ujamaan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-white text-emerald-700 hover:bg-white/90 font-bold"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Créer mon compte
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/')}
              className="border-white/40 text-white hover:bg-white/10"
            >
              Explorer la plateforme
            </Button>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          Premiers pas
        </h2>
        <p className="text-muted-foreground mb-6">Commencez à utiliser Ujamaan en 4 étapes simples</p>

        <div className="space-y-3">
          <Step
            number={1}
            title="Créez votre compte"
            description="Inscrivez-vous gratuitement avec votre email pour accéder à toutes les fonctionnalités."
            icon={<UserPlus className="h-4 w-4 text-emerald-600" />}
            details={[
              'Rendez-vous sur la page Connexion',
              'Cliquez sur "Créer un compte"',
              'Renseignez votre email et un mot de passe sécurisé',
              'Confirmez votre email via le lien reçu',
            ]}
          />
          <Step
            number={2}
            title="Explorez les prix du marché"
            description="Consultez les prix en temps réel sur vos îles. Filtrez par catégorie, vendeur ou localisation."
            icon={<ShoppingCart className="h-4 w-4 text-emerald-600" />}
            details={[
              'Accédez à la section "Prix" depuis le menu',
              'Utilisez les filtres pour trouver un produit spécifique',
              'Cliquez sur un prix pour voir les détails et la localisation du vendeur',
              'Les marchands ambulants affichent leur position GPS en temps réel',
            ]}
          />
          <Step
            number={3}
            title="Activez les notifications"
            description="Recevez les alertes prix, événements et annonces urgentes directement sur votre appareil."
            icon={<Bell className="h-4 w-4 text-emerald-600" />}
            details={[
              'Acceptez les notifications push quand la popup apparaît',
              'Configurez vos alertes prix dans la section Prix',
              'Vous recevrez les notifications même hors de la plateforme',
            ]}
          />
          <Step
            number={4}
            title="Devenez annonceur"
            description="Publiez vos propres annonces, événements et prix. Contribuez à la communauté !"
            icon={<Star className="h-4 w-4 text-emerald-600" />}
            details={[
              'Depuis votre profil, demandez le statut "Annonceur"',
              'Acceptez la charte de publication UJAMAA',
              'Votre demande sera validée par un administrateur',
              'Une fois approuvé, accédez au tableau de bord annonceur',
              'Publiez des annonces, événements, prix et services',
            ]}
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            Nos fonctionnalités
          </h2>
          <p className="text-muted-foreground mb-6">Tout ce dont vous avez besoin, au même endroit</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Roles Explained */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Les types de comptes
        </h2>
        <p className="text-muted-foreground mb-6">Chaque compte offre des avantages différents</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Utilisateur</h3>
                  <Badge variant="secondary" className="text-xs">Gratuit</Badge>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />Consulter tous les prix, événements et annonces</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />Ajouter des favoris et commenter</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />Messagerie directe avec les vendeurs</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />S'inscrire aux événements</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Star className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Annonceur</h3>
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">Sur demande</Badge>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />Tout ce qu'offre le compte utilisateur</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />Publier des annonces, prix et événements</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />Tableau de bord avec statistiques</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />Gérer ses publications</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800 sm:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Pro</h3>
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Abonnement</Badge>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />Tous les avantages annonceur</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />Historique complet des prix et graphiques d'évolution</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />Alertes prix personnalisées</li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />Badge vérifié et visibilité accrue</li>
              </ul>
              <Button
                className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white w-full sm:w-auto"
                onClick={() => navigate('/pro')}
              >
                <Crown className="h-4 w-4 mr-2" /> Découvrir l'offre Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground mb-6">Les réponses aux questions les plus posées</p>

          <div className="space-y-3">
            {[
              { q: 'Ujamaan est-il gratuit ?', a: 'Oui ! L\'inscription et l\'accès aux prix, événements, annonces et services sont entièrement gratuits. Seules certaines fonctionnalités avancées nécessitent un abonnement Pro.' },
              { q: 'Comment publier une annonce ?', a: 'Demandez le statut "Annonceur" depuis votre profil. Une fois approuvé, vous pourrez publier des annonces, événements et prix depuis votre tableau de bord.' },
              { q: 'Les prix affichés sont-ils fiables ?', a: 'Les prix sont soumis par des vendeurs vérifiés et passent par une modération. Chaque prix indique le vendeur, le marché et la date de mise à jour.' },
              { q: 'Comment fonctionne l\'application mobile ?', a: 'Ujamaan est une Progressive Web App (PWA). Vous pouvez l\'installer sur votre téléphone depuis la page "Installer" pour une expérience native.' },
              { q: 'Comment signaler un contenu inapproprié ?', a: 'Chaque contenu dispose d\'un bouton de signalement. Nos modérateurs examinent tous les signalements sous 24h.' },
            ].map(({ q, a }, i) => (
              <FaqItem key={i} question={q} answer={a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">Prêt à rejoindre la communauté ?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Rejoignez des milliers de Comoriens qui utilisent Ujamaan pour s'informer, acheter et vendre.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')} className="font-bold">
            <UserPlus className="h-5 w-5 mr-2" /> S'inscrire gratuitement
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <button
          onClick={() => setOpen(!open)}
          className="w-full text-left p-4 flex items-center justify-between gap-3"
        >
          <span className="font-medium text-foreground text-sm">{question}</span>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        {open && (
          <div className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
