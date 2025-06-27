
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  itemCount: number;
  lastUpdate: string;
  featured?: boolean;
}

const CategoryCard = ({ title, description, icon, itemCount, lastUpdate, featured = false }: CategoryCardProps) => {
  return (
    <Card className={`feature-card card-hover group ${featured ? 'ring-2 ring-emerald-300/50 shadow-emerald-100/50' : ''}`}>
      <CardContent className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className={`p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
            featured 
              ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-ocean-500 text-white shadow-lg' 
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700'
          }`}>
            <div className="text-3xl">{icon}</div>
          </div>
          {featured && (
            <Badge variant="secondary" className="bg-gradient-to-r from-gold-100 to-gold-200 text-gold-800 border-gold-300/50 shadow-sm">
              ⭐ Populaire
            </Badge>
          )}
        </div>
        
        <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-base mb-6 line-clamp-2 leading-relaxed">
          {description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full pulse-ring"></div>
            {itemCount} éléments
          </div>
          <span className="text-gray-500 bg-gray-50 px-3 py-1 rounded-full text-xs">
            📅 {lastUpdate}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
