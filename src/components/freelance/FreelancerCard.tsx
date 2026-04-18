import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Clock, Banknote, MessageCircle, CheckCircle, ExternalLink, Eye, ExternalLink as LinkIcon } from 'lucide-react';
import { FreelancerProfile } from '@/hooks/useFreelancerDirectory';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import FreelancerDetailDialog from './FreelancerDetailDialog';

interface Props {
  profile: FreelancerProfile;
}

export default function FreelancerCard({ profile }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPro = profile.account_type === 'pro';

  const formatRate = () => {
    if (profile.hourly_rate_min && profile.hourly_rate_max) {
      return `${profile.hourly_rate_min.toLocaleString()} - ${profile.hourly_rate_max.toLocaleString()} ${profile.currency}/h`;
    }
    if (profile.hourly_rate_min) return `À partir de ${profile.hourly_rate_min.toLocaleString()} ${profile.currency}/h`;
    if (profile.hourly_rate_max) return `Jusqu'à ${profile.hourly_rate_max.toLocaleString()} ${profile.currency}/h`;
    return null;
  };

  const handleContact = () => {
    if (!user) { navigate(`/auth?redirect=${encodeURIComponent(`/freelancer/${profile.id}`)}`); return; }
    navigate(`/messages/${profile.user_id}`);
  };

  const isOwnProfile = user?.id === profile.user_id;
  const initials = profile.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const socialLinks = [
    profile.whatsapp && { label: 'WhatsApp', url: `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`, color: 'text-green-600' },
    profile.facebook_url && { label: 'Facebook', url: profile.facebook_url, color: 'text-blue-600' },
    profile.linkedin_url && { label: 'LinkedIn', url: profile.linkedin_url, color: 'text-blue-700' },
    profile.twitter_url && { label: 'X', url: profile.twitter_url, color: 'text-foreground' },
    profile.instagram_url && { label: 'Instagram', url: profile.instagram_url, color: 'text-pink-600' },
  ].filter(Boolean) as { label: string; url: string; color: string }[];

  return (
    <>
      <Card className={`group hover:shadow-lg transition-all duration-300 border-border overflow-hidden ${isPro ? 'ring-1 ring-primary/30' : ''}`}>
        <CardContent className="p-0">
          {isPro && (
            <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
          )}

          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-primary/40 transition-all shrink-0">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">{profile.display_name}</h3>
                  {profile.is_available && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                  {isPro && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary/90 shrink-0">PRO</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {profile.experience_years > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />{profile.experience_years} an{profile.experience_years > 1 ? 's' : ''}
                    </span>
                  )}
                  {profile.island && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />{profile.island}
                    </span>
                  )}
                </div>
              </div>

              {!isOwnProfile && (
                <Button size="sm" variant="default" className="gap-1 shrink-0 text-xs" onClick={handleContact}>
                  <MessageCircle className="h-3.5 w-3.5" /> Contacter
                </Button>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 5).map(skill => (
                <Badge key={skill} variant="secondary" className="text-[11px] font-normal px-2 py-0.5">{skill}</Badge>
              ))}
              {profile.skills.length > 5 && (
                <Badge variant="outline" className="text-[11px] px-2 py-0.5">+{profile.skills.length - 5}</Badge>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              {formatRate() ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Banknote className="h-3.5 w-3.5" />{formatRate()}
                </span>
              ) : <span />}

              <div className="flex items-center gap-2">
                {isPro && socialLinks.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {socialLinks.map(link => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${link.color} hover:opacity-70 transition-opacity`}
                        title={link.label}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                )}

                <Link to={`/freelancer/${profile.id}`}>
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-7 px-2.5">
                    <Eye className="h-3.5 w-3.5" /> Voir le profil
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <FreelancerDetailDialog profile={profile} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}
