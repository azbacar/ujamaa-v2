
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
    <Card className={`card-hover cursor-pointer ${featured ? 'ring-2 ring-emerald-200' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${featured ? 'bg-gradient-to-br from-emerald-500 to-ocean-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
            {icon}
          </div>
          {featured && (
            <Badge variant="secondary" className="bg-gold-100 text-gold-700 border-gold-200">
              Populaire
            </Badge>
          )}
        </div>
        
        <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            {itemCount} éléments
          </span>
          <span>Mis à jour: {lastUpdate}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
