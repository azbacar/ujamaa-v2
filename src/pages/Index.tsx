
import { useState } from 'react';
import Header from '@/components/Header';
import CategoryCard from '@/components/CategoryCard';
import IslandSelector from '@/components/IslandSelector';
import QuickActions from '@/components/QuickActions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');

  const categories = [
    {
      title: "Prix & Marchés",
      description: "Prix actualisés des produits alimentaires et biens de consommation dans tous les marchés",
      icon: "💰",
      itemCount: 156,
      lastUpdate: "Aujourd'hui",
      featured: true
    },
    {
      title: "Appels d'Offres",
      description: "Marchés publics, appels à projets et opportunités d'affaires",
      icon: "📋",
      itemCount: 23,
      lastUpdate: "Hier"
    },
    {
      title: "Événements",
      description: "Manifestations culturelles, cérémonies officielles et événements communautaires",
      icon: "🎭",
      itemCount: 45,
      lastUpdate: "Il y a 3h"
    },
    {
      title: "Services Publics",
      description: "Horaires, contacts et informations sur les administrations et services",
      icon: "🏛️",
      itemCount: 78,
      lastUpdate: "Cette semaine"
    },
    {
      title: "Transport",
      description: "Horaires des liaisons, tarifs et informations de transport inter-îles",
      icon: "🚢",
      itemCount: 34,
      lastUpdate: "Aujourd'hui"
    },
    {
      title: "Santé",
      description: "Services de santé, pharmacies de garde et informations médicales",
      icon: "🏥",
      itemCount: 67,
      lastUpdate: "Il y a 2h",
      featured: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Section Héro */}
        <section className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold gradient-text animate-fade-in">
              Bienvenue sur UJAMAA
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Votre hub central pour toutes les informations publiques des Comores. 
              Accédez facilement aux données actualisées dans tous les domaines.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
              Explorer les informations
            </Button>
            <Button variant="outline" size="lg" className="border-emerald-200 text-emerald-700 px-8 py-3 rounded-xl">
              Contacter UJAMAA IA
            </Button>
          </div>
        </section>

        {/* Sélecteur d'îles */}
        <IslandSelector />

        {/* Actions rapides et informations urgentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">Catégories d'information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((category, index) => (
                  <CategoryCard
                    key={index}
                    title={category.title}
                    description={category.description}
                    icon={<span className="text-2xl">{category.icon}</span>}
                    itemCount={category.itemCount}
                    lastUpdate={category.lastUpdate}
                    featured={category.featured}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <QuickActions />
            
            {/* Statistiques */}
            <Card className="glass-effect">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Statistiques du jour</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nouvelles informations</span>
                    <span className="font-semibold text-emerald-600">+34</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Recherches effectuées</span>
                    <span className="font-semibold text-ocean-600">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Îles actives</span>
                    <span className="font-semibold text-gold-600">4/4</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section IA Assistant */}
        <Card className="glass-effect">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-ocean-500 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold">
                🤖
              </div>
              <h3 className="text-2xl font-semibold gradient-text">UJAMAA IA</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Votre assistant intelligent pour naviguer dans l'information comorienne. 
                Posez vos questions en français, anglais, arabe, swahili ou shikomori.
              </p>
              <Button className="bg-gradient-to-r from-emerald-500 to-ocean-500 text-white px-6 py-3 rounded-xl">
                Démarrer une conversation
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-ocean-500 rounded-lg flex items-center justify-center text-white font-bold">
                  U
                </div>
                <span className="text-xl font-bold">UJAMAA</span>
              </div>
              <p className="text-gray-400 text-sm">
                Centralisé • Actualisé • Accessible<br />
                L'information comorienne à portée de main
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Informations</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Prix & Marchés</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Appels d'Offres</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Événements</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Services Publics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Îles</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Grande Comore</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Anjouan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mohéli</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mayotte</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 UJAMAA Call Center. Tous droits réservés. 🇰🇲</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
