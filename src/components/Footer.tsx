
const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white py-16 mt-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-ocean-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                U
              </div>
              <span className="text-2xl font-bold">Ujamaan</span>
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
              <li><a href="/pro" className="hover:text-emerald-400 transition-colors flex items-center gap-2">⭐ Devenir Pro</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📞 Contact</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">ℹ️ À propos</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🔒 Confidentialité</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📋 Conditions</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-400 text-base">
            &copy; 2024 Ujamaan Call Center. Tous droits réservés. 
            <span className="ml-2 text-2xl">🇰🇲</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
