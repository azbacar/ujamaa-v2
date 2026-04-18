import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Clock, Banknote, MessageCircle, CheckCircle, ExternalLink, Globe, Briefcase, Eye } from 'lucide-react';
import { useFreelancerProfileById } from '@/hooks/useFreelancerDirectory';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { usePageSEO } from '@/hooks/usePageSEO';
import SocialShareButtons from '@/components/SocialShareButtons';
import { supabase } from '@/integrations/supabase/client';

export default function FreelancerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading } = useFreelancerProfileById(id);
  const { user } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();

  usePageSEO({
    title: profile ? `${profile.display_name} — Freelancer Comores` : 'Profil freelancer',
    description: profile?.bio?.substring(0, 160) || 'Découvrez ce freelancer sur Ujamaan Comores.',
    canonicalPath: id ? `/freelancer/${id}` : undefined,
    ogType: 'profile',
    keywords: profile ? `freelance, ${profile.skills.slice(0, 5).join(', ')}, comores` : undefined,
  });

  // Increment view count
  useEffect(() => {
    if (!profile?.id) return;
    supabase.rpc('increment_freelancer_views' as any, { _profile_id: profile.id }).then(() => {}, () => {
      // fallback: direct update
      supabase.from('freelancer_profiles').update({ views: (profile.views || 0) + 1 }).eq('id', profile.id);
    });
  }, [profile?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <main className="container mx-auto px-4 py-8">
          <div className="h-64 bg-muted animate-pulse rounded-lg max-w-3xl mx-auto" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Freelancer introuvable</p>
          <Link to="/freelancers"><Button variant="outline">Retour au répertoire</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isPro = (profile as any).account_type === 'pro';
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
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/freelancer/${id}`)}`);
      return;
    }
    navigate(`/messages/${profile.user_id}`);
  };

  const socialLinks = [
    profile.whatsapp && { label: 'WhatsApp', url: `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`, color: 'text-green-600' },
    profile.facebook_url && { label: 'Facebook', url: profile.facebook_url, color: 'text-blue-600' },
    profile.linkedin_url && { label: 'LinkedIn', url: profile.linkedin_url, color: 'text-blue-700' },
    profile.twitter_url && { label: 'X / Twitter', url: profile.twitter_url, color: 'text-foreground' },
    profile.instagram_url && { label: 'Instagram', url: profile.instagram_url, color: 'text-pink-600' },
  ].filter(Boolean) as { label: string; url: string; color: string }[];

  return (
    <div className="min-h-screen bg-background">
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
        <Link to="/freelancers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Retour au répertoire
        </Link>

        <Card className={isPro ? 'ring-1 ring-primary/30' : ''}>
          {isPro && <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50 rounded-t-lg" />}
          <CardContent className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-24 w-24 ring-2 ring-border shrink-0">
                {profile.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{profile.display_name}</h1>
                  {profile.is_available && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {isPro && <Badge variant="default" className="bg-primary/90 text-xs">PRO</Badge>}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                  {profile.experience_years > 0 && (
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{profile.experience_years} an{profile.experience_years > 1 ? 's' : ''}</span>
                  )}
                  {profile.island && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.island}</span>}
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{profile.views} vues</span>
                </div>
                {formatRate() && (
                  <p className="flex items-center gap-1 text-sm font-semibold text-primary mt-2">
                    <Banknote className="h-4 w-4" />{formatRate()}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> Présentation</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2">Compétences</h2>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs font-normal px-2.5 py-1">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {profile.portfolio_url && (
              <div>
                <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                  <Globe className="h-4 w-4" /> Voir le portfolio <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Social links — Pro only */}
            {isPro && socialLinks.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2">Contact & Réseaux</h2>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map(link => (
                    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors ${link.color}`}>
                      <ExternalLink className="h-3 w-3" /> {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {!isOwnProfile && (
              <Button className="w-full gap-2" onClick={handleContact}>
                <MessageCircle className="h-4 w-4" /> Contacter {profile.display_name.split(' ')[0]}
              </Button>
            )}

            {/* Share */}
            <div className="pt-4 border-t border-border">
              <SocialShareButtons title={`${profile.display_name} — Freelancer Comores`} description={profile.bio || ''} />
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
