import { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.prices': 'Prix & Marchés',
    'nav.tenders': 'Appels d\'Offres',
    'nav.events': 'Événements',
    'nav.services': 'Services',
    'nav.announcements': 'Annonces',
    
    // Hero Section
    'hero.title': 'UJAMAA - Centre d\'Information des Comores',
    'hero.subtitle': 'Votre plateforme centrale pour tous les prix, événements, services et informations officielles des îles Comores',
    'hero.search': 'Rechercher des informations...',
    
    // Common
    'common.loading': 'Chargement...',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.viewMore': 'Voir plus',
    'common.readMore': 'Lire plus',
    'common.viewDetails': 'Voir détails',
    'common.contact': 'Contacter',
    'common.close': 'Fermer',
    
    // Islands
    'island.grandeComore': 'Grande Comore',
    'island.anjouan': 'Anjouan',
    'island.moheli': 'Mohéli',
    'island.mayotte': 'l\'île au lagon',
    
    // AI Assistant
    'ai.title': 'Assistant IA UJAMAA',
    'ai.subtitle': 'Posez vos questions sur les prix, événements, services et plus encore',
    'ai.placeholder': 'Posez votre question sur les Comores...',
    'ai.online': 'En ligne',
    'ai.popularQuestions': 'Questions populaires',
    'ai.capabilities': 'Capacités de l\'IA'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.prices': 'Prices & Markets',
    'nav.tenders': 'Tenders',
    'nav.events': 'Events',
    'nav.services': 'Services',
    'nav.announcements': 'Announcements',
    
    // Hero Section
    'hero.title': 'UJAMAA - Comoros Information Center',
    'hero.subtitle': 'Your central platform for all prices, events, services and official information of the Comoros Islands',
    'hero.search': 'Search for information...',
    
    // Common
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.viewMore': 'View more',
    'common.readMore': 'Read more',
    'common.viewDetails': 'View details',
    'common.contact': 'Contact',
    'common.close': 'Close',
    
    // Islands
    'island.grandeComore': 'Grande Comore',
    'island.anjouan': 'Anjouan',
    'island.moheli': 'Mohéli',
    'island.mayotte': 'Lagoon Island',
    
    // AI Assistant
    'ai.title': 'UJAMAA AI Assistant',
    'ai.subtitle': 'Ask questions about prices, events, services and more',
    'ai.placeholder': 'Ask your question about Comoros...',
    'ai.online': 'Online',
    'ai.popularQuestions': 'Popular questions',
    'ai.capabilities': 'AI Capabilities'
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.prices': 'الأسعار والأسواق',
    'nav.tenders': 'المناقصات',
    'nav.events': 'الأحداث',
    'nav.services': 'الخدمات',
    'nav.announcements': 'الإعلانات',
    
    // Hero Section
    'hero.title': 'أوجاماا - مركز معلومات جزر القمر',
    'hero.subtitle': 'منصتكم المركزية لجميع الأسعار والأحداث والخدمات والمعلومات الرسمية لجزر القمر',
    'hero.search': 'البحث عن المعلومات...',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.viewMore': 'عرض المزيد',
    'common.readMore': 'اقرأ المزيد',
    'common.viewDetails': 'عرض التفاصيل',
    'common.contact': 'اتصال',
    'common.close': 'إغلاق',
    
    // Islands
    'island.grandeComore': 'القمر الكبرى',
    'island.anjouan': 'أنجوان',
    'island.moheli': 'موهيلي',
    'island.mayotte': 'جزيرة البحيرة',
    
    // AI Assistant
    'ai.title': 'مساعد أوجاماا الذكي',
    'ai.subtitle': 'اسأل عن الأسعار والأحداث والخدمات والمزيد',
    'ai.placeholder': 'اسأل سؤالك عن جزر القمر...',
    'ai.online': 'متصل',
    'ai.popularQuestions': 'الأسئلة الشائعة',
    'ai.capabilities': 'قدرات الذكاء الاصطناعي'
  },
  sw: {
    // Navigation
    'nav.home': 'Nyumbani',
    'nav.prices': 'Bei na Masoko',
    'nav.tenders': 'Zabuni',
    'nav.events': 'Matukio',
    'nav.services': 'Huduma',
    'nav.announcements': 'Matangazo',
    
    // Hero Section
    'hero.title': 'UJAMAA - Kituo cha Habari za Komoro',
    'hero.subtitle': 'Jukwaa lako kuu la bei zote, matukio, huduma na habari rasmi za Visiwa vya Komoro',
    'hero.search': 'Tafuta habari...',
    
    // Common
    'common.loading': 'Inapakia...',
    'common.search': 'Tafuta',
    'common.filter': 'Chuja',
    'common.viewMore': 'Ona zaidi',
    'common.readMore': 'Soma zaidi',
    'common.viewDetails': 'Ona maelezo',
    'common.contact': 'Wasiliana',
    'common.close': 'Funga',
    
    // Islands
    'island.grandeComore': 'Komoro Kuu',
    'island.anjouan': 'Anjouan',
    'island.moheli': 'Mohéli',
    'island.mayotte': 'Kisiwa cha Bwawa',
    
    // AI Assistant
    'ai.title': 'Msaidizi wa UJAMAA AI',
    'ai.subtitle': 'Uliza maswali kuhusu bei, matukio, huduma na mengine',
    'ai.placeholder': 'Uliza swali lako kuhusu Komoro...',
    'ai.online': 'Mtandaoni',
    'ai.popularQuestions': 'Maswali maarufu',
    'ai.capabilities': 'Uwezo wa AI'
  },
  zdj: {
    // Navigation
    'nav.home': 'Ndroni',
    'nav.prices': 'Maha na Zoko',
    'nav.tenders': 'Muzozo',
    'nav.events': 'Shitru',
    'nav.services': 'Hidima',
    'nav.announcements': 'Matangazo',
    
    // Hero Section
    'hero.title': 'UJAMAA - Ntsi wa Haɓari za Komori',
    'hero.subtitle': 'Yenu jukwa la maha yose, shitru, hidima na haɓari za kimila za Visiwa vya Komori',
    'hero.search': 'Tsaha haɓari...',
    
    // Common
    'common.loading': 'Tsatsariya...',
    'common.search': 'Tsaha',
    'common.filter': 'Shagua',
    'common.viewMore': 'Ona zayidi',
    'common.readMore': 'Soma zayidi',
    'common.viewDetails': 'Ona maelezo',
    'common.contact': 'Haribu',
    'common.close': 'Funga',
    
    // Islands
    'island.grandeComore': 'Ngazija',
    'island.anjouan': 'Ndzuwani',
    'island.moheli': 'Mwali',
    'island.mayotte': 'Maore',
    
    // AI Assistant
    'ai.title': 'Msaidizi wa UJAMAA AI',
    'ai.subtitle': 'Uliza maswali ya maha, shitru, hidima na mengine',
    'ai.placeholder': 'Uliza swali lako la Komori...',
    'ai.online': 'Mtandaoni',
    'ai.popularQuestions': 'Maswali maarufu',
    'ai.capabilities': 'Uwezo wa AI'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [currentLanguage, setCurrentLanguage] = useState('fr');

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = (key: string): string => {
    return translations[currentLanguage as keyof typeof translations]?.[key as keyof typeof translations.fr] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};