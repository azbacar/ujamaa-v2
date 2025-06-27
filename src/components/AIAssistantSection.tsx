
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AIAssistantSection = () => {
  return (
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
  );
};

export default AIAssistantSection;
