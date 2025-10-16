
import CategoryCard from '@/components/CategoryCard';

const CategoriesSection = () => {
  const categories = [
    {
      title: "Prix & Marchés",
      description: "Prix actualisés des produits alimentaires et biens de consommation dans tous les marchés",
      icon: "💰",
      itemCount: 156,
      lastUpdate: "Aujourd'hui",
      featured: true,
      link: "/prix"
    },
    {
      title: "Appels d'Offres",
      description: "Marchés publics, appels à projets et opportunités d'affaires",
      icon: "📋",
      itemCount: 23,
      lastUpdate: "Hier",
      link: "/appels-offres"
    },
    {
      title: "Événements",
      description: "Manifestations culturelles, cérémonies officielles et événements communautaires",
      icon: "🎭",
      itemCount: 45,
      lastUpdate: "Il y a 3h",
      link: "/evenements"
    },
    {
      title: "Services Publics",
      description: "Horaires, contacts et informations sur les administrations et services",
      icon: "🏛️",
      itemCount: 78,
      lastUpdate: "Cette semaine",
      link: "/services"
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
      featured: true,
      link: "/services"
    },
    {
      title: "Tourisme",
      description: "Restaurants, hôtels, hébergements et découverte gastronomique locale",
      icon: "🏨",
      itemCount: 89,
      lastUpdate: "Aujourd'hui",
      featured: true,
      link: "/tourisme"
    }
  ];

  return (
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
            link={category.link}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoriesSection;
