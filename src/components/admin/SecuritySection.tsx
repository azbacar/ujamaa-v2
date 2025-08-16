import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Eye,
  AlertTriangle,
  Key,
  UserX,
  Activity,
  Globe,
  Clock,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SecurityLog {
  id: string;
  type: 'login' | 'failed_login' | 'permission_change' | 'suspicious_activity';
  user_id?: string;
  ip_address: string;
  user_agent: string;
  details: any;
  created_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface BannedIP {
  id: string;
  ip_address: string;
  reason: string;
  banned_at: string;
  banned_by: string;
  expires_at?: string;
}

export default function SecuritySection() {
  const { user } = useAuth();
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBanIP, setNewBanIP] = useState('');
  const [newBanReason, setNewBanReason] = useState('');
  
  // Security Settings
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [ipWhitelistOnly, setIpWhitelistOnly] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      // Mock data - would fetch from actual security logs
      const mockLogs: SecurityLog[] = [
        {
          id: '1',
          type: 'login',
          user_id: user?.id,
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          details: { success: true },
          created_at: new Date().toISOString(),
          severity: 'low'
        },
        {
          id: '2',
          type: 'failed_login',
          ip_address: '192.168.1.50',
          user_agent: 'Mozilla/5.0 (Linux; Android 10)',
          details: { attempts: 3, blocked: false },
          created_at: new Date(Date.now() - 300000).toISOString(),
          severity: 'medium'
        },
        {
          id: '3',
          type: 'suspicious_activity',
          user_id: user?.id,
          ip_address: '192.168.1.200',
          user_agent: 'curl/7.68.0',
          details: { rapid_requests: true, count: 100 },
          created_at: new Date(Date.now() - 600000).toISOString(),
          severity: 'high'
        }
      ];

      const mockBannedIPs: BannedIP[] = [
        {
          id: '1',
          ip_address: '192.168.1.999',
          reason: 'Tentatives de connexion répétées',
          banned_at: new Date(Date.now() - 86400000).toISOString(),
          banned_by: user?.id || '',
          expires_at: new Date(Date.now() + 86400000).toISOString()
        }
      ];

      setSecurityLogs(mockLogs);
      setBannedIPs(mockBannedIPs);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Erreur lors du chargement des données de sécurité');
    } finally {
      setLoading(false);
    }
  };

  const handleBanIP = async () => {
    if (!newBanIP || !newBanReason) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const newBan: BannedIP = {
        id: Date.now().toString(),
        ip_address: newBanIP,
        reason: newBanReason,
        banned_at: new Date().toISOString(),
        banned_by: user?.id || '',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      setBannedIPs(prev => [newBan, ...prev]);
      setNewBanIP('');
      setNewBanReason('');
      toast.success('Adresse IP bannie');
    } catch (error) {
      console.error('Error banning IP:', error);
      toast.error('Erreur lors du bannissement');
    }
  };

  const handleUnbanIP = async (ipId: string) => {
    try {
      setBannedIPs(prev => prev.filter(ban => ban.id !== ipId));
      toast.success('Adresse IP débannie');
    } catch (error) {
      console.error('Error unbanning IP:', error);
      toast.error('Erreur lors du débannissement');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'low': return 'bg-green-50 text-green-600 border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'critical': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getLogIcon = (type: string) => {
    switch(type) {
      case 'login': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed_login': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'permission_change': return <Key className="h-4 w-4 text-blue-500" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité du système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-green-200 rounded-lg bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {securityLogs.filter(log => log.type === 'login').length}
              </div>
              <div className="text-sm text-slate-600">Connexions</div>
            </div>
            <div className="text-center p-4 border border-red-200 rounded-lg bg-red-50">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {securityLogs.filter(log => log.type === 'failed_login').length}
              </div>
              <div className="text-sm text-slate-600">Échecs</div>
            </div>
            <div className="text-center p-4 border border-orange-200 rounded-lg bg-orange-50">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {securityLogs.filter(log => log.severity === 'high' || log.severity === 'critical').length}
              </div>
              <div className="text-sm text-slate-600">Alertes</div>
            </div>
            <div className="text-center p-4 border border-purple-200 rounded-lg bg-purple-50">
              <Ban className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{bannedIPs.length}</div>
              <div className="text-sm text-slate-600">IPs bannies</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-blue-200">
          <TabsTrigger value="logs" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Activity className="h-4 w-4" />
            Journaux
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Ban className="h-4 w-4" />
            IPs bloquées
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Lock className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Eye className="h-4 w-4" />
            Surveillance
          </TabsTrigger>
        </TabsList>

        {/* Security Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Journal de sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 border border-blue-200 rounded-lg bg-white hover:bg-blue-50">
                    {getLogIcon(log.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {log.type === 'login' && 'Connexion réussie'}
                          {log.type === 'failed_login' && 'Échec de connexion'}
                          {log.type === 'permission_change' && 'Changement de permissions'}
                          {log.type === 'suspicious_activity' && 'Activité suspecte'}
                        </span>
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>IP: {log.ip_address}</div>
                        <div>User-Agent: {log.user_agent.substring(0, 50)}...</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs */}
        <TabsContent value="blocked" className="space-y-4">
          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Bannir une adresse IP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ban-ip">Adresse IP</Label>
                  <Input
                    id="ban-ip"
                    value={newBanIP}
                    onChange={(e) => setNewBanIP(e.target.value)}
                    placeholder="192.168.1.100"
                    className="border-blue-200"
                  />
                </div>
                <div>
                  <Label htmlFor="ban-reason">Raison</Label>
                  <Input
                    id="ban-reason"
                    value={newBanReason}
                    onChange={(e) => setNewBanReason(e.target.value)}
                    placeholder="Tentatives de connexion répétées"
                    className="border-blue-200"
                  />
                </div>
              </div>
              <Button 
                onClick={handleBanIP}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Ban className="h-4 w-4 mr-2" />
                Bannir l'adresse IP
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Adresses IP bannies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bannedIPs.map((ban) => (
                  <div key={ban.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <div className="font-medium text-red-900">{ban.ip_address}</div>
                      <div className="text-sm text-red-700">{ban.reason}</div>
                      <div className="text-xs text-red-600">
                        Banni le {new Date(ban.banned_at).toLocaleString('fr-FR')}
                        {ban.expires_at && ` • Expire le ${new Date(ban.expires_at).toLocaleString('fr-FR')}`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnbanIP(ban.id)}
                      className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                    >
                      Débannir
                    </Button>
                  </div>
                ))}
                {bannedIPs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune adresse IP bannie
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Paramètres de sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Authentification à deux facteurs obligatoire</Label>
                      <p className="text-xs text-muted-foreground">
                        Exiger 2FA pour tous les utilisateurs
                      </p>
                    </div>
                    <Switch 
                      checked={twoFactorRequired} 
                      onCheckedChange={setTwoFactorRequired}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Liste blanche IP uniquement</Label>
                      <p className="text-xs text-muted-foreground">
                        Autoriser seulement les IPs approuvées
                      </p>
                    </div>
                    <Switch 
                      checked={ipWhitelistOnly} 
                      onCheckedChange={setIpWhitelistOnly}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Délai d'expiration de session (minutes)</Label>
                    <Input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(Number(e.target.value))}
                      className="border-blue-200"
                    />
                  </div>

                  <div>
                    <Label>Tentatives de connexion max</Label>
                    <Input
                      type="number"
                      value={maxLoginAttempts}
                      onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                      className="border-blue-200"
                    />
                  </div>
                </div>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Lock className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Monitoring */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card className="border-blue-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Surveillance en temps réel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-6 border border-blue-200 rounded-lg">
                  <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
                </div>
                <div className="text-center p-6 border border-green-200 rounded-lg">
                  <Globe className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">98.5%</div>
                  <div className="text-sm text-muted-foreground">Disponibilité</div>
                </div>
                <div className="text-center p-6 border border-orange-200 rounded-lg">
                  <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">0.2s</div>
                  <div className="text-sm text-muted-foreground">Temps de réponse</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}