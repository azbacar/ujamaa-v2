import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Banknote, MessageCircle, CheckCircle } from 'lucide-react';
import { FreelancerProfile } from '@/hooks/useFreelancerDirectory';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  profile: FreelancerProfile;
}

export default function FreelancerCard({ profile }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const formatRate = () => {
    if (profile.hourly_rate_min && profile.hourly_rate_max) {
      return `${profile.hourly_rate_min.toLocaleString()} - ${profile.hourly_rate_max.toLocaleString()} ${profile.currency}/h`;
    }
    if (profile.hourly_rate_min) return `À partir de ${profile.hourly_rate_min.toLocaleString()} ${profile.currency}/h`;
    if (profile.hourly_rate_max) return `Jusqu'à ${profile.hourly_rate_max.toLocaleString()} ${profile.currency}/h`;
    return null;
  };

  const handleContact = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/messages/${profile.user_id}`);
  };

  const isOwnProfile = user?.id === profile.user_id;

  return (
    <Card className="hover:shadow-md transition-shadow border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              {profile.display_name}
              {profile.is_available && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </h3>
            {profile.experience_years > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />{profile.experience_years} an{profile.experience_years > 1 ? 's' : ''} d'expérience
              </span>
            )}
          </div>
          {!isOwnProfile && (
            <Button size="sm" variant="default" className="gap-1 shrink-0" onClick={handleContact}>
              <MessageCircle className="h-3 w-3" /> Contacter
            </Button>
          )}
        </div>

        {profile.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {profile.skills.slice(0, 6).map(skill => (
            <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
          ))}
          {profile.skills.length > 6 && (
            <Badge variant="outline" className="text-xs">+{profile.skills.length - 6}</Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
          {profile.island && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />{profile.island}{profile.location && ` · ${profile.location}`}
            </span>
          )}
          {formatRate() && (
            <span className="flex items-center gap-1 font-medium text-primary">
              <Banknote className="h-3 w-3" />{formatRate()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
