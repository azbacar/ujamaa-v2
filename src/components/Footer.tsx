
const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white py-10 sm:py-16 mt-12 sm:mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          <div className="col-span-2 md:col-span-1 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-ocean-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                U
              </div>
              <span className="text-xl sm:text-2xl font-bold">Ujamaan</span>
            </div>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              <span className="font-semibold text-emerald-400">Centralisé • Actualisé • Accessible</span>
              <br />
              L'information comorienne à portée de main
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-emerald-400">Informations</h4>
            <ul className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
              <li><a href="/prix" className="hover:text-emerald-400 transition-colors flex items-center gap-2">💰 Prix & Marchés</a></li>
              <li><a href="/appels-offres" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📋 Appels d'Offres</a></li>
              <li><a href="/evenements" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🎭 Événements</a></li>
              <li><a href="/services" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏛️ Services Publics</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-emerald-400">Îles</h4>
            <ul className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
              <li><a href="/ile/grande-comore" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏔️ Grande Comore</a></li>
              <li><a href="/ile/anjouan" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🌺 Anjouan</a></li>
              <li><a href="/ile/moheli" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🐢 Mohéli</a></li>
              <li><a href="/ile/mayotte" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏝️ Mayotte</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-emerald-400">Support</h4>
            <ul className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
              <li><a href="/install" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📲 Installer l'app</a></li>
              <li><a href="/pro" className="hover:text-emerald-400 transition-colors flex items-center gap-2">⭐ Devenir Pro</a></li>
              <li><a href="/page/contact" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📞 Contact</a></li>
              <li><a href="/page/a-propos" className="hover:text-emerald-400 transition-colors flex items-center gap-2">ℹ️ À propos</a></li>
              <li><a href="/page/confidentialite" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🔒 Confidentialité</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
          <p className="text-gray-400 text-sm sm:text-base">
            &copy; 2024 Ujamaan Call Center. Tous droits réservés. 
            <span className="ml-2 text-2xl">🇰🇲</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
