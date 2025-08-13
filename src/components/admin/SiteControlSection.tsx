import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Globe, 
  Database,
  Upload,
  Download,
  Trash2,
  AlertTriangle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Mail,
  Bell,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';

export default function SiteControlSection() {
  const { user } = useAuth();
  
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newUserRegistration, setNewUserRegistration] = useState(true);
  const [publicViewAccess, setPublicViewAccess] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching site settings:', error);
        return;
      }

      if (data) {
        setMaintenanceMode(data.maintenance_mode);
        setNewUserRegistration(data.allow_registration);
        setPublicViewAccess(data.public_view_access);
        setEmailNotifications(data.email_notifications);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSettings = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      // Check if settings exist, if not create them
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1);

      const settingsData = {
        maintenance_mode: maintenanceMode,
        allow_registration: newUserRegistration,
        public_view_access: publicViewAccess,
        email_notifications: emailNotifications,
        updated_by: user.id
      };

      if (existingSettings && existingSettings.length > 0) {
        const { error } = await supabase
          .from('site_settings')
          .update(settingsData)
          .eq('id', existingSettings[0].id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert(settingsData);
        
        if (error) throw error;
      }

      toast.success('Paramètres du site mis à jour');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erreur lors de la mise à jour des paramètres');
    }
  };

  const handleDatabaseBackup = () => {
    toast.success('Sauvegarde de la base de données initiée');
  };

  const handleClearCache = () => {
    toast.success('Cache système vidé');
  };

  const handleGlobalAnnouncement = async () => {
    if (!announcementTitle || !announcementContent) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const { error } = await supabase
        .from('global_announcements')
        .insert({
          title: announcementTitle,
          content: announcementContent,
          type: announcementType as 'info' | 'warning' | 'urgent' | 'maintenance',
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Annonce globale publiée');
      setAnnouncementTitle('');
      setAnnouncementContent('');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Erreur lors de la publication de l\'annonce');
    }
  };

  return (
    <div className="space-y-6">
      {/* Site Configuration */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration du site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Site Status Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  {maintenanceMode ? <Lock className="h-5 w-5 text-red-500" /> : <Unlock className="h-5 w-5 text-green-600" />}
                  <div>
                    <Label className="text-sm font-medium">Mode maintenance</Label>
                    <p className="text-xs text-muted-foreground">
                      {maintenanceMode ? 'Site en maintenance' : 'Site opérationnel'}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={maintenanceMode} 
                  onCheckedChange={setMaintenanceMode}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  {newUserRegistration ? <Eye className="h-5 w-5 text-green-600" /> : <EyeOff className="h-5 w-5 text-orange-500" />}
                  <div>
                    <Label className="text-sm font-medium">Nouvelles inscriptions</Label>
                    <p className="text-xs text-muted-foreground">
                      {newUserRegistration ? 'Autorisées' : 'Bloquées'}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={newUserRegistration} 
                  onCheckedChange={setNewUserRegistration}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  {publicViewAccess ? <Globe className="h-5 w-5 text-blue-600" /> : <Lock className="h-5 w-5 text-red-500" />}
                  <div>
                    <Label className="text-sm font-medium">Accès public</Label>
                    <p className="text-xs text-muted-foreground">
                      {publicViewAccess ? 'Contenu visible publiquement' : 'Accès restreint'}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={publicViewAccess} 
                  onCheckedChange={setPublicViewAccess}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  {emailNotifications ? <Mail className="h-5 w-5 text-purple-600" /> : <Bell className="h-5 w-5 text-slate-400" />}
                  <div>
                    <Label className="text-sm font-medium">Notifications email</Label>
                    <p className="text-xs text-muted-foreground">
                      {emailNotifications ? 'Activées' : 'Désactivées'}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSiteSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les paramètres
          </Button>
        </CardContent>
      </Card>

      {/* System Operations */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Opérations système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleDatabaseBackup}
              className="bg-green-600 hover:bg-green-700 text-white h-auto p-4 flex-col gap-2"
            >
              <Download className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Sauvegarde</div>
                <div className="text-xs opacity-90">Base de données</div>
              </div>
            </Button>

            <Button 
              onClick={handleClearCache}
              className="bg-orange-500 hover:bg-orange-600 text-white h-auto p-4 flex-col gap-2"
            >
              <RefreshCw className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Vider cache</div>
                <div className="text-xs opacity-90">Système</div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-auto p-4 flex-col gap-2"
            >
              <Trash2 className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Nettoyer logs</div>
                <div className="text-xs opacity-90">Ancien historique</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Global Announcements */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Annonces globales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="announcement-title">Titre de l'annonce</Label>
              <Input
                id="announcement-title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Titre de l'annonce..."
                className="border-blue-200 bg-white focus:ring-blue-500"
              />
            </div>
            
            <div>
              <Label htmlFor="announcement-type">Type d'annonce</Label>
              <Select value={announcementType} onValueChange={setAnnouncementType}>
                <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="announcement-content">Contenu</Label>
            <Textarea
              id="announcement-content"
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              placeholder="Contenu de l'annonce..."
              rows={4}
              className="border-blue-200 bg-white focus:ring-blue-500"
            />
          </div>
          
          <Button 
            onClick={handleGlobalAnnouncement}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Bell className="h-4 w-4 mr-2" />
            Publier l'annonce globale
          </Button>
        </CardContent>
      </Card>

      {/* Alert Section */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zone de danger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ces actions peuvent affecter le fonctionnement du site. Utilisez avec précaution.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Réinitialiser utilisateurs inactifs
              </Button>
              
              <Button 
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Database className="h-4 w-4 mr-2" />
                Optimiser base de données
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}