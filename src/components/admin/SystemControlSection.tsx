import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Database, 
  Server, 
  Globe, 
  Mail, 
  Bell, 
  Settings,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  cacheEnabled: boolean;
  debugMode: boolean;
  autoBackup: boolean;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  maxFileSize: number;
  sessionTimeout: number;
}

export default function SystemControlSection() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    cacheEnabled: true,
    debugMode: false,
    autoBackup: true,
    siteName: 'UJAMAA Plateforme',
    siteDescription: 'Plateforme d\'information centralisée pour les Comores',
    contactEmail: 'admin@ujamaa.com',
    maxFileSize: 10,
    sessionTimeout: 30
  });

  const [systemStats] = useState({
    uptime: '15 jours, 4 heures',
    totalRequests: '1,247,893',
    cacheHitRate: '94.5%',
    responseTime: '127ms',
    storage: '2.4 GB / 50 GB',
    lastBackup: 'Il y a 2 heures'
  });

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    toast.success('Paramètres système sauvegardés');
  };

  const handleCreateBackup = () => {
    toast.success('Sauvegarde créée avec succès');
  };

  const handleClearCache = () => {
    toast.success('Cache vidé avec succès');
  };

  const handleSystemRestart = () => {
    if (confirm('Êtes-vous sûr de vouloir redémarrer le système ?')) {
      toast.success('Redémarrage du système en cours...');
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Contrôle système
        </h2>
        <p className="text-slate-600">
          Gérez les paramètres système, la maintenance et les performances.
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <Server className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="font-medium text-slate-900">Uptime</div>
            <div className="text-sm text-slate-600">{systemStats.uptime}</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-slate-900">Requêtes</div>
            <div className="text-sm text-slate-600">{systemStats.totalRequests}</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="font-medium text-slate-900">Cache</div>
            <div className="text-sm text-slate-600">{systemStats.cacheHitRate}</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <Globe className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="font-medium text-slate-900">Réponse</div>
            <div className="text-sm text-slate-600">{systemStats.responseTime}</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <div className="font-medium text-slate-900">Stockage</div>
            <div className="text-sm text-slate-600">{systemStats.storage}</div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="font-medium text-slate-900">Sauvegarde</div>
            <div className="text-sm text-slate-600">{systemStats.lastBackup}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Paramètres généraux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="siteName">Nom du site</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange('siteName', e.target.value)}
                  className="border-slate-300"
                />
              </div>
              
              <div>
                <Label htmlFor="siteDescription">Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                  className="border-slate-300"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="contactEmail">Email de contact</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Controls */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Contrôles système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mode maintenance</Label>
                  <p className="text-sm text-slate-600">Désactive temporairement le site</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Inscription ouverte</Label>
                  <p className="text-sm text-slate-600">Autorise les nouvelles inscriptions</p>
                </div>
                <Switch
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => handleSettingChange('registrationEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Cache activé</Label>
                  <p className="text-sm text-slate-600">Améliore les performances</p>
                </div>
                <Switch
                  checked={settings.cacheEnabled}
                  onCheckedChange={(checked) => handleSettingChange('cacheEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mode debug</Label>
                  <p className="text-sm text-slate-600">Affiche les erreurs détaillées</p>
                </div>
                <Switch
                  checked={settings.debugMode}
                  onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={handleSaveSettings}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-16"
        >
          <Settings className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Sauvegarder</div>
            <div className="text-xs opacity-90">Paramètres</div>
          </div>
        </Button>
        
        <Button
          onClick={handleCreateBackup}
          variant="outline"
          className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 h-16"
        >
          <Download className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Sauvegarder</div>
            <div className="text-xs opacity-70">Base de données</div>
          </div>
        </Button>
        
        <Button
          onClick={handleClearCache}
          variant="outline"
          className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 h-16"
        >
          <RefreshCw className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Vider cache</div>
            <div className="text-xs opacity-70">Performances</div>
          </div>
        </Button>
        
        <Button
          onClick={handleSystemRestart}
          variant="outline"
          className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 h-16"
        >
          <AlertTriangle className="h-5 w-5" />
          <div className="text-left">
            <div className="font-medium">Redémarrer</div>
            <div className="text-xs opacity-70">Système</div>
          </div>
        </Button>
      </div>

      {/* Advanced Settings */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Paramètres avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="maxFileSize">Taille max fichier (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="sessionTimeout">Timeout session (min)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                className="border-slate-300"
              />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900">Attention</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Modifier ces paramètres peut affecter le fonctionnement du site. 
                  Assurez-vous de comprendre les implications avant de procéder.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}