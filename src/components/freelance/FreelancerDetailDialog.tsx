import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Clock, Banknote, MessageCircle, CheckCircle, ExternalLink, Globe, Briefcase } from 'lucide-react';
import { FreelancerProfile } from '@/hooks/useFreelancerDirectory';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  profile: FreelancerProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FreelancerDetailDialog({ profile, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPro = profile.account_type === 'pro';
  const isOwnProfile = user?.id === profile.user_id;
  const initials = profile.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const formatRate = () => {
    if (profile.hourly_rate_min && profile.hourly_rate_max) {
      return `${profile.hourly_rate_min.toLocaleString()} - ${profile.hourly_rate_max.toLocaleString()} ${profile.currency}/h`;
    }
    if (profile.hourly_rate_min) return `À partir de ${profile.hourly_rate_min.toLocaleString()} ${profile.currency}/h`;
    if (profile.hourly_rate_max) return `Jusqu'à ${profile.hourly_rate_max.toLocaleString()} ${profile.currency}/h`;
    return null;
  };

  const handleContact = () => {
    if (!user) { navigate('/auth'); return; }
    navigate(`/messages/${profile.user_id}`);
    onOpenChange(false);
  };

  const socialLinks = [
    profile.whatsapp && { label: 'WhatsApp', url: `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`, color: 'text-green-600' },
    profile.facebook_url && { label: 'Facebook', url: profile.facebook_url, color: 'text-blue-600' },
    profile.linkedin_url && { label: 'LinkedIn', url: profile.linkedin_url, color: 'text-blue-700' },
    profile.twitter_url && { label: 'X / Twitter', url: profile.twitter_url, color: 'text-foreground' },
    profile.instagram_url && { label: 'Instagram', url: profile.instagram_url, color: 'text-pink-600' },
  ].filter(Boolean) as { label: string; url: string; color: string }[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Profil de {profile.display_name}</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 ring-2 ring-border shrink-0">
            {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{profile.display_name}</h2>
              {profile.is_available && <CheckCircle className="h-5 w-5 text-green-500" />}
              {isPro && <Badge variant="default" className="bg-primary/90 text-xs">PRO</Badge>}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
              {profile.experience_years > 0 && (
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{profile.experience_years} an{profile.experience_years > 1 ? 's' : ''} d'expérience</span>
              )}
              {profile.island && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.island}</span>
              )}
              {profile.location && !profile.island && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
              )}
            </div>
            {formatRate() && (
              <p className="flex items-center gap-1 text-sm font-semibold text-primary mt-1.5">
                <Banknote className="h-4 w-4" />{formatRate()}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> Présentation</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Compétences</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs font-normal px-2.5 py-1">{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {profile.portfolio_url && (
          <div className="mt-4">
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            >
              <Globe className="h-4 w-4" /> Voir le portfolio <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Social links (Pro only) */}
        {isPro && socialLinks.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Contact & Réseaux</h3>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(link => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors ${link.color}`}
                >
                  <ExternalLink className="h-3 w-3" /> {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
          <span>{profile.views} vue{profile.views !== 1 ? 's' : ''}</span>
          <span>Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
        </div>

        {/* CTA */}
        {!isOwnProfile && (
          <Button className="w-full mt-3 gap-2" onClick={handleContact}>
            <MessageCircle className="h-4 w-4" /> Contacter {profile.display_name.split(' ')[0]}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
