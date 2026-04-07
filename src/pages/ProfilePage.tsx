import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, User, Shield, Mail, Crown, Megaphone, 
  BarChart3, Eye, FileText, Calendar, DollarSign,
  LogOut, Key, Star, Activity, Clock, ChevronRight,
  Edit3, Save, X, Utensils, Camera, Loader2,
  Heart, Flag, Trash2, BadgeCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AvatarCropDialog from '@/components/AvatarCropDialog';

const PasswordChangeSection = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Veuillez entrer votre mot de passe actuel');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setChangingPassword(true);
    try {
      // Re-authenticate with current password first
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email) throw new Error('Utilisateur non trouvé');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });
      if (signInError) {
        toast.error('Mot de passe actuel incorrect');
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Mot de passe mis à jour avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Mot de passe</p>
            <p className="text-sm text-muted-foreground">Modifiez votre mot de passe directement</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : 'Modifier'}
        </Button>
      </div>
      {showForm && (
        <div className="space-y-3 pt-2 border-t">
          <div>
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Votre mot de passe actuel"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez le mot de passe"
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="w-full"
          >
            {changingPassword ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Modification...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Enregistrer le nouveau mot de passe</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { role, isAdmin, isModerator, isAnnonceur } = useRole();
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({ announcements: 0, events: 0, prices: 0, gastronomy: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
        setUsername(profile.username);
      }

      // Fetch stats based on role
      const [contentRes, eventsRes, pricesRes, gastronomyRes] = await Promise.all([
        supabase.from('content_items').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
        supabase.from('prices').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
        supabase.from('gastronomy_items').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      ]);

      setStats({
        announcements: contentRes.count || 0,
        events: eventsRes.count || 0,
        prices: pricesRes.count || 0,
        gastronomy: gastronomyRes.count || 0,
      });

      // Fetch recent activity (recent content + events by user)
      const { data: recentContent } = await supabase
        .from('content_items')
        .select('id, title, type, status, created_at')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentEvents } = await supabase
        .from('events')
        .select('id, title, status, created_at')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const combined = [
        ...(recentContent || []).map(c => ({ ...c, source: 'content' })),
        ...(recentEvents || []).map(e => ({ ...e, type: 'event', source: 'event' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

      setRecentActivity(combined);

      // Fetch favorites
      const { data: favData } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setFavorites(favData || []);

      // Fetch reports
      const { data: repData } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setReports(repData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !username.trim()) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ username: username.trim() })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Nom d\'utilisateur mis à jour');
      setIsEditing(false);
      fetchUserData();
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCroppedUpload = async (blob: Blob) => {
    if (!user) return;
    setCropImageSrc(null);
    setUploadingAvatar(true);
    try {
      const filePath = `${user.id}/avatar.jpg`;

      // Delete old avatar files
      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id);
      if (existingFiles?.length) {
        await supabase.storage.from('avatars').remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      toast.success('Avatar mis à jour !');
      fetchUserData();
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <>
        <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="w-96">
            <CardContent className="p-6 text-center space-y-4">
              <User className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Vous devez être connecté pour accéder à cette page.</p>
              <Button onClick={() => navigate('/auth')}>Se connecter</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return { label: 'Administrateur', icon: Shield, color: 'bg-red-500', badge: 'destructive' as const };
      case 'moderator':
        return { label: 'Modérateur', icon: Eye, color: 'bg-blue-500', badge: 'secondary' as const };
      case 'annonceur':
        return { label: 'Annonceur', icon: Megaphone, color: 'bg-amber-500', badge: 'default' as const };
      default:
        return { label: 'Utilisateur', icon: User, color: 'bg-emerald-500', badge: 'outline' as const };
    }
  };

  const roleConfig = getRoleConfig();
  const RoleIcon = roleConfig.icon;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge variant="default" className="text-xs">Publié</Badge>;
      case 'draft': return <Badge variant="secondary" className="text-xs">Brouillon</Badge>;
      case 'archived': return <Badge variant="outline" className="text-xs">Archivé</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      announcement: 'Annonce', event: 'Événement', service: 'Service', tender: 'Appel d\'offres'
    };
    return labels[type] || type;
  };

  return (
    <>
      <Header currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Hero profile card */}
          <Card className="mb-6 overflow-hidden">
            <div className="h-24 bg-primary opacity-90" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
                <div className="relative group">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-2xl object-cover shadow-lg border-4 border-background"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg border-4 border-background">
                      {userProfile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                    {uploadingAvatar ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploadingAvatar} />
                  </label>
                </div>
                {cropImageSrc && (
                  <AvatarCropDialog
                    open={!!cropImageSrc}
                    imageSrc={cropImageSrc}
                    onClose={() => setCropImageSrc(null)}
                    onCropComplete={handleCroppedUpload}
                  />
                )}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">{userProfile?.username || user.email?.split('@')[0]}</h1>
                    <Badge variant={roleConfig.badge}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleConfig.label}
                    </Badge>
                    {userProfile?.account_type === 'pro' && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                        <Crown className="h-3 w-3 mr-1" /> PRO
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {(isAdmin() || isModerator()) && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                      <Shield className="h-4 w-4 mr-1" /> Admin
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-1" /> Déconnexion
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats cards */}
          {(isAnnonceur() || isModerator() || isAdmin()) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Annonces', value: stats.announcements, icon: FileText, color: 'text-blue-500' },
                { label: 'Événements', value: stats.events, icon: Calendar, color: 'text-emerald-500' },
                { label: 'Prix soumis', value: stats.prices, icon: DollarSign, color: 'text-amber-500' },
                { label: 'Gastronomie', value: stats.gastronomy, icon: Utensils, color: 'text-rose-500' },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
              <TabsTrigger value="info"><User className="h-4 w-4 mr-1" /> Profil</TabsTrigger>
              <TabsTrigger value="security"><Key className="h-4 w-4 mr-1" /> Sécurité</TabsTrigger>
              <TabsTrigger value="favorites"><Heart className="h-4 w-4 mr-1" /> Favoris</TabsTrigger>
              <TabsTrigger value="reports"><Flag className="h-4 w-4 mr-1" /> Signalements</TabsTrigger>
              <TabsTrigger value="verification"><BadgeCheck className="h-4 w-4 mr-1" /> Vérification</TabsTrigger>
              {(isAnnonceur() || isModerator() || isAdmin()) && (
                <TabsTrigger value="content"><FileText className="h-4 w-4 mr-1" /> Mes contenus</TabsTrigger>
              )}
              {(isModerator() || isAdmin()) && (
                <TabsTrigger value="moderation"><Eye className="h-4 w-4 mr-1" /> Modération</TabsTrigger>
              )}
              {isAdmin() && (
                <TabsTrigger value="admin"><Shield className="h-4 w-4 mr-1" /> Administration</TabsTrigger>
              )}
            </TabsList>

            {/* Tab: Profil */}
            <TabsContent value="info">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations personnelles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nom d'utilisateur</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={!isEditing}
                        />
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button size="icon" variant="default" onClick={handleSaveUsername}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setIsEditing(false); setUsername(userProfile?.username || ''); }}><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <Button size="icon" variant="outline" onClick={() => setIsEditing(true)}><Edit3 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={user.email || ''} disabled className="mt-1" />
                    </div>
                    <div>
                      <Label>Type de compte</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={userProfile?.account_type === 'pro' ? 'default' : 'outline'}>
                          {userProfile?.account_type === 'pro' ? '⭐ PRO' : 'Gratuit'}
                        </Badge>
                        {userProfile?.account_type !== 'pro' && (
                          <Button variant="link" size="sm" className="text-amber-600" onClick={() => navigate('/pro')}>
                            Passer à PRO <ChevronRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statut du compte</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rôle</span>
                      <Badge variant={roleConfig.badge}><RoleIcon className="h-3 w-3 mr-1" />{roleConfig.label}</Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Email vérifié</span>
                      <Badge variant={user.email_confirmed_at ? 'default' : 'destructive'}>
                        {user.email_confirmed_at ? '✓ Vérifié' : '✗ Non vérifié'}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Dernière connexion</span>
                      <span className="text-sm text-foreground">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Inscrit le</span>
                      <span className="text-sm text-foreground">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Sécurité */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sécurité & Confidentialité</CardTitle>
                  <CardDescription>Gérez vos paramètres de sécurité</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Password change inline */}
                  <PasswordChangeSection />
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Email</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant={user.email_confirmed_at ? 'default' : 'destructive'}>
                      {user.email_confirmed_at ? 'Vérifié' : 'Non vérifié'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-4">
                    <div>
                      <p className="font-medium text-destructive mb-1">Zone dangereuse</p>
                      <p className="text-sm text-muted-foreground mb-3">La déconnexion supprimera votre session locale.</p>
                      <Button variant="destructive" size="sm" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-1" /> Se déconnecter
                      </Button>
                    </div>
                    <Separator />
                    <div>
                      <p className="font-medium text-destructive mb-1">Suppression du compte</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Vous pouvez demander la suppression définitive de votre compte et de toutes vos données personnelles. 
                        Cette action est irréversible.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          const subject = encodeURIComponent('Demande de suppression de compte');
                          const body = encodeURIComponent(`Bonjour,\n\nJe souhaite demander la suppression définitive de mon compte et de toutes mes données personnelles.\n\nEmail du compte : ${user.email}\nIdentifiant : ${user.id}\n\nCordialement`);
                          window.open(`mailto:contact@ujamaan.com?subject=${subject}&body=${body}`, '_blank');
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Demander la suppression de mon compte
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Favoris */}
            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5" /> Mes Favoris
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {favorites.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Heart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Aucun favori pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {favorites.map(fav => (
                        <div key={fav.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <Badge variant="outline" className="text-xs">{fav.content_type}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Ajouté le {new Date(fav.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Signalements */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flag className="h-5 w-5" /> Mes Signalements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Flag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Aucun signalement</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reports.map(rep => (
                        <div key={rep.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium text-sm">{rep.reason}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{rep.content_type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(rep.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <Badge variant={rep.status === 'pending' ? 'secondary' : rep.status === 'reviewed' ? 'default' : 'outline'}>
                            {rep.status === 'pending' ? 'En attente' : rep.status === 'reviewed' ? 'Traité' : 'Rejeté'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Vérification */}
            <TabsContent value="verification">
              <VerificationRequestForm />
            </TabsContent>

            {/* Tab: Mes contenus (annonceur+) */}
            {(isAnnonceur() || isModerator() || isAdmin()) && (
              <TabsContent value="content">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5" /> Activité récente
                    </CardTitle>
                    <CardDescription>Vos dernières publications et soumissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Aucune activité pour le moment</p>
                        <p className="text-xs mt-1">Créez du contenu depuis la plateforme</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentActivity.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-md bg-muted">
                                {item.type === 'event' ? <Calendar className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">{item.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-muted-foreground">{getTypeLabel(item.type)}</span>
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Tab: Modération (moderator+) */}
            {(isModerator() || isAdmin()) && (
              <TabsContent value="moderation">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Outils de modération</CardTitle>
                      <CardDescription>Accès rapide aux fonctions de modération</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: 'Modifications en attente', icon: FileText, path: '/admin' },
                        { label: 'Gestion des événements', icon: Calendar, path: '/admin' },
                        { label: 'Gestion des prix', icon: DollarSign, path: '/admin' },
                        { label: 'Gestion du contenu', icon: Eye, path: '/admin' },
                      ].map((item) => (
                        <Button
                          key={item.label}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: 'Voir tous les contenus', granted: true },
                        { label: 'Approuver les modifications', granted: true },
                        { label: 'Gérer les événements', granted: true },
                        { label: 'Gérer les utilisateurs', granted: isAdmin() },
                        { label: 'Paramètres du site', granted: isAdmin() },
                        { label: 'Supprimer le contenu', granted: isAdmin() },
                      ].map((p) => (
                        <div key={p.label} className="flex justify-between items-center py-1.5">
                          <span className="text-sm text-foreground">{p.label}</span>
                          <Badge variant={p.granted ? 'default' : 'outline'} className="text-xs">
                            {p.granted ? '✓' : '✗'}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Tab: Administration (admin only) */}
            {isAdmin() && (
              <TabsContent value="admin">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Administration</CardTitle>
                      <CardDescription>Accès complet au tableau de bord</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { label: 'Tableau de bord admin', icon: BarChart3 },
                        { label: 'Gestion des utilisateurs', icon: User },
                        { label: 'Paramètres du site', icon: Settings },
                        { label: 'Analyse IA', icon: Star },
                        { label: 'Sécurité', icon: Shield },
                      ].map((item) => (
                        <Button
                          key={item.label}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => navigate('/admin')}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Accès super-admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Vous avez un accès complet à toutes les fonctionnalités de la plateforme.
                      </p>
                      <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                        <p><strong>Rôle :</strong> Administrateur</p>
                        <p><strong>Compte :</strong> {userProfile?.account_type === 'pro' ? 'PRO' : 'Standard'}</p>
                        <p><strong>ID :</strong> <code className="text-xs">{user.id.slice(0, 12)}...</code></p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfilePage;
