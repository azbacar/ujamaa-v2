import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Globe,
  Mail,
  Users,
  Wrench,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  Info,
  Palette,
  Layout,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface SiteSettings {
  id: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  public_view_access: boolean;
  email_notifications: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

interface GlobalAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'maintenance';
  created_by: string;
  created_at: string;
}

export default function SiteControlSection() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info' as GlobalAnnouncement['type']
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch site settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settingsData) {
        setSettings(settingsData);
      } else {
        // Create default settings
        const defaultSettings = {
          maintenance_mode: false,
          allow_registration: true,
          public_view_access: true,
          email_notifications: true,
          updated_by: user?.id
        };

        const { data: newSettings, error: createError } = await supabase
          .from('site_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }

      // Fetch global announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('global_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;
      setAnnouncements(announcementsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    if (!settings) return;

    try {
      setSaving(true);
      const updatedSettings = {
        ...settings,
        ...newSettings,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('site_settings')
        .update(updatedSettings)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(updatedSettings);
      toast.success('Paramètres mis à jour');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const announcement = {
        ...newAnnouncement,
        created_by: user?.id
      };

      const { data, error } = await supabase
        .from('global_announcements')
        .insert([announcement])
        .select()
        .single();

      if (error) throw error;

      setAnnouncements(prev => [data, ...prev]);
      setNewAnnouncement({ title: '', content: '', type: 'info' });
      toast.success('Annonce globale créée');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Erreur lors de la création');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      const { error } = await supabase
        .from('global_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Annonce supprimée');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'success': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'error': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-ocean-50 text-ocean-600 border-ocean-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Site Status Overview */}
      <Card className="admin-card">
        <CardHeader className="admin-gradient-header text-white">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            État du site
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-emerald-200 rounded-lg bg-emerald-50">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-lg font-semibold">
                {settings?.maintenance_mode ? 'Maintenance' : 'En ligne'}
              </div>
              <div className="text-sm text-emerald-600">Statut</div>
            </div>
            <div className="text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-lg font-semibold">
                {settings?.allow_registration ? 'Ouvert' : 'Fermé'}
              </div>
              <div className="text-sm text-blue-600">Inscription</div>
            </div>
            <div className="text-center p-4 border border-purple-200 rounded-lg bg-purple-50">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-semibold">
                {settings?.public_view_access ? 'Public' : 'Privé'}
              </div>
              <div className="text-sm text-purple-600">Accès</div>
            </div>
            <div className="text-center p-4 border border-orange-200 rounded-lg bg-orange-50">
              <Mail className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-semibold">
                {settings?.email_notifications ? 'Actif' : 'Inactif'}
              </div>
              <div className="text-sm text-orange-600">Notifications</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-blue-200">
          <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Settings className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <AlertTriangle className="h-4 w-4" />
            Annonces
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Server className="h-4 w-4" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Paramètres généraux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Autoriser les inscriptions</Label>
                      <p className="text-xs text-muted-foreground">
                        Permettre aux nouveaux utilisateurs de s'inscrire
                      </p>
                    </div>
                    <Switch 
                      checked={settings?.allow_registration || false}
                      onCheckedChange={(checked) => updateSettings({ allow_registration: checked })}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Accès public</Label>
                      <p className="text-xs text-muted-foreground">
                        Permettre l'accès sans authentification
                      </p>
                    </div>
                    <Switch 
                      checked={settings?.public_view_access || false}
                      onCheckedChange={(checked) => updateSettings({ public_view_access: checked })}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Notifications email</Label>
                      <p className="text-xs text-muted-foreground">
                        Envoyer des notifications par email
                      </p>
                    </div>
                    <Switch 
                      checked={settings?.email_notifications || false}
                      onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-amber-200 rounded-lg bg-amber-50">
                    <div>
                      <Label className="text-sm font-medium">Mode maintenance</Label>
                      <p className="text-xs text-amber-600">
                        Désactiver l'accès au site pour maintenance
                      </p>
                    </div>
                    <Switch 
                      checked={settings?.maintenance_mode || false}
                      onCheckedChange={(checked) => updateSettings({ maintenance_mode: checked })}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Global Announcements */}
        <TabsContent value="announcements" className="space-y-4">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Créer une annonce globale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="announcement-title">Titre</Label>
                  <Input
                    id="announcement-title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de l'annonce"
                    className="border-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="announcement-type">Type</Label>
                  <select 
                    className="w-full p-2 border border-blue-200 rounded-md"
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, type: e.target.value as GlobalAnnouncement['type'] }))}
                  >
                    <option value="info">Information</option>
                    <option value="warning">Avertissement</option>
                    <option value="urgent">Urgent</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="announcement-content">Contenu</Label>
                <Textarea
                  id="announcement-content"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Contenu de l'annonce"
                  className="border-blue-200 min-h-20"
                />
              </div>
              <Button 
                onClick={createAnnouncement}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Créer l'annonce
              </Button>
            </CardContent>
          </Card>

          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Annonces actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="flex items-start justify-between p-4 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-1 rounded-full ${getTypeColor(announcement.type)}`}>
                        {getTypeIcon(announcement.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{announcement.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{announcement.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(announcement.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAnnouncement(announcement.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune annonce globale active
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Outils de maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => toast.info('Cache vidé (simulation)')}
                >
                  <Database className="h-6 w-6" />
                  <span>Vider le cache</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => toast.info('Base de données optimisée (simulation)')}
                >
                  <Server className="h-6 w-6" />
                  <span>Optimiser la DB</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Info */}
        <TabsContent value="system" className="space-y-4">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Informations système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Version de l'application</div>
                  <div className="text-sm text-muted-foreground">v1.0.0</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Base de données</div>
                  <div className="text-sm text-muted-foreground">PostgreSQL 13.x</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Dernière mise à jour</div>
                  <div className="text-sm text-muted-foreground">
                    {settings?.updated_at ? new Date(settings.updated_at).toLocaleString('fr-FR') : 'N/A'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Serveur</div>
                  <div className="text-sm text-muted-foreground">Supabase</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}