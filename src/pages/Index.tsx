
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
    <div className="min-h-screen">
      <Header currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      
      <main className="container mx-auto px-6 py-12 space-y-16">
        {/* Section Héro */}
        <section className="text-center space-y-8 py-16 hero-gradient rounded-3xl">
          <div className="space-y-6">
            <div className="floating-element">
              <h1 className="text-5xl md:text-7xl font-black gradient-text mb-4">
                Bienvenue sur UJAMAA
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-ocean-500 mx-auto rounded-full"></div>
            </div>
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium">
              Votre hub central pour toutes les informations publiques des Comores. 
              <br className="hidden md:block" />
              <span className="text-emerald-600 font-semibold">Accédez facilement aux données actualisées</span> dans tous les domaines.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-ocean-500 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-300/50 transition-all text-lg h-auto">
              🚀 Explorer les informations
            </Button>
            <Button variant="outline" size="lg" className="border-2 border-emerald-300 text-emerald-700 px-10 py-4 rounded-2xl font-bold bg-white/80 hover:bg-emerald-50 text-lg h-auto">
              🤖 Contacter UJAMAA IA
            </Button>
          </div>
        </section>

        {/* Sélecteur d'îles */}
        <IslandSelector />

        {/* Actions rapides et informations urgentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Catégories d'information</h2>
                <p className="text-xl text-gray-600">Explorez nos différentes catégories de données</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categories.map((category, index) => (
                  <CategoryCard
                    key={index}
                    title={category.title}
                    description={category.description}
                    icon={<span className="text-3xl">{category.icon}</span>}
                    itemCount={category.itemCount}
                    lastUpdate={category.lastUpdate}
                    featured={category.featured}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <QuickActions />
            
            {/* Statistiques */}
            <Card className="glass-effect shadow-2xl">
              <CardContent className="p-8">
                <h3 className="font-bold text-2xl text-gray-900 mb-6 flex items-center gap-3">
                  📊 Statistiques du jour
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
                    <span className="text-base text-gray-700 font-medium">Nouvelles informations</span>
                    <span className="font-bold text-2xl text-emerald-600">+34</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
                    <span className="text-base text-gray-700 font-medium">Recherches effectuées</span>
                    <span className="font-bold text-2xl text-ocean-600">1,247</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
                    <span className="text-base text-gray-700 font-medium">Îles actives</span>
                    <span className="font-bold text-2xl text-gold-600">4/4</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section IA Assistant */}
        <Card className="glass-effect shadow-2xl overflow-hidden">
          <CardContent className="p-12">
            <div className="text-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 via-emerald-600 to-ocean-500 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-2xl floating-element">
                  🤖
                </div>
                <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-emerald-400 to-ocean-400 rounded-full mx-auto pulse-ring"></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold gradient-text">UJAMAA IA</h3>
                <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-ocean-500 mx-auto rounded-full"></div>
              </div>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Votre assistant intelligent pour naviguer dans l'information comorienne. 
                <br />
                <span className="font-semibold text-emerald-600">Posez vos questions en français, anglais, arabe, swahili ou shikomori.</span>
              </p>
              <Button className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-ocean-500 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:shadow-emerald-300/50 transition-all text-lg">
                💬 Démarrer une conversation
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Footer amélioré */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white py-16 mt-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-ocean-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  U
                </div>
                <span className="text-2xl font-bold">UJAMAA</span>
              </div>
              <p className="text-gray-300 text-base leading-relaxed">
                <span className="font-semibold text-emerald-400">Centralisé • Actualisé • Accessible</span>
                <br />
                L'information comorienne à portée de main
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 text-emerald-400">Informations</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">💰 Prix & Marchés</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📋 Appels d'Offres</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🎭 Événements</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏛️ Services Publics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 text-emerald-400">Îles</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏔️ Grande Comore</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🌺 Anjouan</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🐢 Mohéli</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏝️ Mayotte</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 text-emerald-400">Support</h4>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📞 Contact</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">ℹ️ À propos</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🔒 Confidentialité</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📋 Conditions</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-base">
              &copy; 2024 UJAMAA Call Center. Tous droits réservés. 
              <span className="ml-2 text-2xl">🇰🇲</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
