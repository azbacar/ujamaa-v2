
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
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
        <Button size="lg" className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-ocean-500 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-magenta-500/50 transition-all text-lg h-auto">
          🚀 Explorer les informations
        </Button>
        <Button variant="outline" size="lg" className="border-2 border-emerald-300 text-emerald-700 px-10 py-4 rounded-2xl font-bold bg-white/80 hover:bg-emerald-50 text-lg h-auto">
          🤖 Contacter UJAMAA IA
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
