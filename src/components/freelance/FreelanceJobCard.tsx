import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Wifi, User, Eye } from 'lucide-react';
import { FreelanceJob, FREELANCE_CATEGORIES } from '@/hooks/useFreelance';

interface Props {
  job: FreelanceJob;
}

export default function FreelanceJobCard({ job }: Props) {
  const categoryLabel = FREELANCE_CATEGORIES.find(c => c.value === job.category)?.label || job.category;

  const formatBudget = () => {
    if (job.budget_min && job.budget_max) {
      return `${job.budget_min.toLocaleString()} - ${job.budget_max.toLocaleString()} ${job.currency}`;
    }
    if (job.budget_min) return `À partir de ${job.budget_min.toLocaleString()} ${job.currency}`;
    if (job.budget_max) return `Jusqu'à ${job.budget_max.toLocaleString()} ${job.currency}`;
    return 'Budget à discuter';
  };

  const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000);
  const timeLabel = daysAgo === 0 ? "Aujourd'hui" : daysAgo === 1 ? 'Hier' : `Il y a ${daysAgo} jours`;

  return (
    <Link to={`/freelance/${job.id}`}>
      <Card className="hover:shadow-md transition-shadow border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-2">{job.title}</h3>
            <Badge variant="secondary" className="shrink-0 text-xs">{categoryLabel}</Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 4).map(skill => (
              <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
            ))}
            {job.skills.length > 4 && (
              <Badge variant="outline" className="text-xs">+{job.skills.length - 4}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />{job.author_username}
              </span>
              {job.island && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{job.island}
                </span>
              )}
              {job.is_remote && (
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />À distance
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />{job.views} vue{job.views !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-primary">{formatBudget()}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{timeLabel}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
