import { useState } from 'react';
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
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newUserRegistration, setNewUserRegistration] = useState(true);
  const [publicViewAccess, setPublicViewAccess] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');

  const handleSiteSettings = () => {
    toast.success('Paramètres du site mis à jour');
  };

  const handleDatabaseBackup = () => {
    toast.success('Sauvegarde de la base de données initiée');
  };

  const handleClearCache = () => {
    toast.success('Cache système vidé');
  };

  const handleGlobalAnnouncement = () => {
    if (!announcementTitle || !announcementContent) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    toast.success('Annonce globale publiée');
    setAnnouncementTitle('');
    setAnnouncementContent('');
  };

  return (
    <div className="space-y-6">
      {/* Site Configuration */}
      <Card className="border-admin-border bg-admin-surface">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-admin-primary flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration du site
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Site Status Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-admin-border rounded-lg bg-admin-surface-hover">
                <div className="flex items-center gap-3">
                  {maintenanceMode ? <Lock className="h-5 w-5 text-admin-danger" /> : <Unlock className="h-5 w-5 text-admin-success" />}
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

              <div className="flex items-center justify-between p-4 border border-admin-border rounded-lg bg-admin-surface-hover">
                <div className="flex items-center gap-3">
                  {newUserRegistration ? <Eye className="h-5 w-5 text-admin-success" /> : <EyeOff className="h-5 w-5 text-admin-warning" />}
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
              <div className="flex items-center justify-between p-4 border border-admin-border rounded-lg bg-admin-surface-hover">
                <div className="flex items-center gap-3">
                  {publicViewAccess ? <Globe className="h-5 w-5 text-admin-primary" /> : <Lock className="h-5 w-5 text-admin-danger" />}
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

              <div className="flex items-center justify-between p-4 border border-admin-border rounded-lg bg-admin-surface-hover">
                <div className="flex items-center gap-3">
                  {emailNotifications ? <Mail className="h-5 w-5 text-admin-accent" /> : <Bell className="h-5 w-5 text-muted-foreground" />}
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
            className="bg-admin-primary hover:bg-admin-primary/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les paramètres
          </Button>
        </CardContent>
      </Card>

      {/* System Operations */}
      <Card className="border-admin-border bg-admin-surface">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-admin-primary flex items-center gap-2">
            <Database className="h-5 w-5" />
            Opérations système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleDatabaseBackup}
              className="bg-admin-secondary hover:bg-admin-secondary/90 text-white h-auto p-4 flex-col gap-2"
            >
              <Download className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Sauvegarde</div>
                <div className="text-xs opacity-90">Base de données</div>
              </div>
            </Button>

            <Button 
              onClick={handleClearCache}
              className="bg-admin-warning hover:bg-admin-warning/90 text-white h-auto p-4 flex-col gap-2"
            >
              <RefreshCw className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Vider cache</div>
                <div className="text-xs opacity-90">Système</div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="border-admin-danger text-admin-danger hover:bg-admin-danger hover:text-white h-auto p-4 flex-col gap-2"
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
      <Card className="border-admin-border bg-admin-surface">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-admin-primary flex items-center gap-2">
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
                className="border-admin-border bg-admin-surface focus:ring-admin-accent"
              />
            </div>
            
            <div>
              <Label htmlFor="announcement-type">Type d'annonce</Label>
              <Select value={announcementType} onValueChange={setAnnouncementType}>
                <SelectTrigger className="border-admin-border bg-admin-surface focus:ring-admin-accent">
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
              className="border-admin-border bg-admin-surface focus:ring-admin-accent"
            />
          </div>
          
          <Button 
            onClick={handleGlobalAnnouncement}
            className="bg-admin-accent hover:bg-admin-accent/90 text-white"
          >
            <Bell className="h-4 w-4 mr-2" />
            Publier l'annonce globale
          </Button>
        </CardContent>
      </Card>

      {/* Alert Section */}
      <Card className="border-admin-danger/20 bg-gradient-to-r from-admin-danger/5 to-admin-warning/5">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-admin-danger flex items-center gap-2">
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
                className="border-admin-danger text-admin-danger hover:bg-admin-danger hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Réinitialiser utilisateurs inactifs
              </Button>
              
              <Button 
                variant="outline"
                className="border-admin-danger text-admin-danger hover:bg-admin-danger hover:text-white"
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