import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MapPin, Calendar, TrendingUp, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DiasporaProject } from '@/hooks/useDiaspora';

interface Props {
  project: DiasporaProject;
}

const categoryLabels: Record<string, string> = {
  agriculture: '🌾 Agriculture',
  immobilier: '🏠 Immobilier',
  commerce: '🏪 Commerce',
  technologie: '💻 Technologie',
  education: '📚 Éducation',
  sante: '🏥 Santé',
  energie: '⚡ Énergie',
  tourisme: '🏖️ Tourisme',
  artisanat: '🎨 Artisanat',
  autre: '📦 Autre',
};

export default function DiasporaProjectCard({ project }: Props) {
  const progress = project.target_amount > 0
    ? Math.min((project.current_amount / project.target_amount) * 100, 100)
    : 0;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-FR').format(amount) + ' ' + project.currency;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {project.images?.[0] && (
        <div className="aspect-video overflow-hidden">
          <img
            src={project.images[0]}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {categoryLabels[project.category] || project.category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            {project.views}
          </div>
        </div>
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 mt-2">
          {project.title}
        </h3>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {project.island && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {project.island}
            </span>
          )}
          {project.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(project.deadline).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              {formatAmount(project.current_amount)}
            </span>
            <span className="text-muted-foreground">
              / {formatAmount(project.target_amount)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}% financé</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
          <Link to={`/investissement/${project.id}`}>Voir le projet</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
