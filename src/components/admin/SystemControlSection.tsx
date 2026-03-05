import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, Database, Server, Globe, Settings, RefreshCw, Download, AlertTriangle, CheckCircle, Activity, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function SystemControlSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState('');

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');

  // Real stats
  const [userCount, setUserCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [analyticsCount, setAnalyticsCount] = useState(0);

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSettingsId(data.id);
        setMaintenanceMode(data.maintenance_mode);
        setRegistrationEnabled(data.allow_registration);
        setEmailNotifications(data.email_notifications);
        setSiteName(data.site_name || '');
        setSiteDescription(data.hero_subtitle || '');
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const [u, c, a] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('content_items').select('*', { count: 'exact', head: true }),
      supabase.from('site_analytics').select('*', { count: 'exact', head: true }),
    ]);
    setUserCount(u.count || 0);
    setContentCount(c.count || 0);
    setAnalyticsCount(a.count || 0);
  };

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          maintenance_mode: maintenanceMode,
          allow_registration: registrationEnabled,
          email_notifications: emailNotifications,
          site_name: siteName || null,
          hero_subtitle: siteDescription || null,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settingsId);
      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        _action_type: 'system_settings_update',
        _description: `Paramètres système mis à jour par ${user?.email}`,
      });

      toast.success('Paramètres système sauvegardés avec succès');
    } catch (e: any) {
      toast.error('Erreur: ' + (e.message || 'Sauvegarde impossible'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Contrôle système
        </h2>
        <p className="text-slate-600">Gérez les paramètres système, la maintenance et les performances.</p>
      </div>

      {/* Real System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <Server className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="font-medium text-slate-900">Utilisateurs</div>
            <div className="text-2xl font-bold text-slate-900">{userCount}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-slate-900">Contenus</div>
            <div className="text-2xl font-bold text-slate-900">{contentCount}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="font-medium text-slate-900">Analytics</div>
            <div className="text-2xl font-bold text-slate-900">{analyticsCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Paramètres généraux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Nom du site</Label>
              <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="border-slate-300" />
            </div>
            <div>
              <Label htmlFor="siteDescription">Description</Label>
              <Textarea id="siteDescription" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} className="border-slate-300" rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Contrôles système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Mode maintenance</Label>
                <p className="text-sm text-slate-600">Désactive temporairement le site</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Inscription ouverte</Label>
                <p className="text-sm text-slate-600">Autorise les nouvelles inscriptions</p>
              </div>
              <Switch checked={registrationEnabled} onCheckedChange={setRegistrationEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications email</Label>
                <p className="text-sm text-slate-600">Envoyer des notifications par email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg gap-2">
        <Save className="h-5 w-5" />
        {saving ? 'Sauvegarde en cours...' : 'Sauvegarder tous les paramètres'}
      </Button>

      {maintenanceMode && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900">Mode maintenance actif</h4>
              <p className="text-sm text-orange-700 mt-1">Le site est actuellement en mode maintenance. Les visiteurs verront un message d'indisponibilité.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
