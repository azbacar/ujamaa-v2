import { Link } from 'react-router-dom';

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
              <li><Link to="/prix" className="hover:text-emerald-400 transition-colors flex items-center gap-2">💰 Prix</Link></li>
              <li><Link to="/evenements" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🎭 Événements</Link></li>
              <li><Link to="/services" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏛️ Services Publics</Link></li>
              <li><Link to="/appels-offres" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📋 Appels d'Offres</Link></li>
              <li><Link to="/infos-pratiques" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📋 Info pratique</Link></li>
              <li><Link to="/investissement" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🌍 Investissement / Lever de fond</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-emerald-400">Îles</h4>
            <ul className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
              <li><Link to="/ile/grande-comore" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏔️ Grande Comore</Link></li>
              <li><Link to="/ile/anjouan" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🌺 Anjouan</Link></li>
              <li><Link to="/ile/moheli" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🐢 Mohéli</Link></li>
              <li><Link to="/ile/mayotte" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🏝️ Mayotte</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-emerald-400">Support</h4>
            <ul className="space-y-2 sm:space-y-3 text-gray-300 text-sm sm:text-base">
              <li><Link to="/install" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📲 Installer l'app</Link></li>
              <li><Link to="/pro" className="hover:text-emerald-400 transition-colors flex items-center gap-2">⭐ Devenir Pro</Link></li>
              <li><Link to="/page/contact" className="hover:text-emerald-400 transition-colors flex items-center gap-2">📞 Contact</Link></li>
              <li><Link to="/supprimer-compte" className="hover:text-emerald-400 transition-colors flex items-center gap-2">🗑️ Supprimer mon compte</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Barre de liens rapides */}
        <div className="border-t border-gray-700 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-400">
            <Link to="/page/a-propos" className="hover:text-emerald-400 transition-colors">À propos</Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link to="/tourisme" className="hover:text-emerald-400 transition-colors">Tourisme</Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link to="/investissement" className="hover:text-emerald-400 transition-colors">Investissement</Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link to="/freelancers" className="hover:text-emerald-400 transition-colors">Freelance</Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link to="/freelance" className="hover:text-emerald-400 transition-colors">Missions</Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link to="/appels-offres" className="hover:text-emerald-400 transition-colors">Appels d'offres</Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link to="/infos-pratiques" className="hover:text-emerald-400 transition-colors">Infos Pratiques</Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link to="/page/conditions" className="hover:text-emerald-400 transition-colors">Conditions d'utilisation</Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link to="/page/confidentialite" className="hover:text-emerald-400 transition-colors">Confidentialité</Link>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-6 text-center">
          <p className="text-gray-400 text-sm sm:text-base">
            &copy; {new Date().getFullYear()} Ujamaan Call Center. Tous droits réservés. 
            <span className="ml-2 text-2xl">🇰🇲</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
