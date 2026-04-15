import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Key, Copy, Trash2, Plus, Eye, EyeOff, Shield, Code, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'login', label: 'Login (authentification)', description: 'Permet la connexion des utilisateurs' },
  { id: 'admin', label: 'Admin (accès complet)', description: 'Accès à toutes les ressources API' },
];

const API_BASE_URL = `https://vpibvgdpeiicczelbynf.supabase.co/functions/v1/mobile-api`;

export default function ApiManagementSection() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(['login']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const fetchKeys = async () => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, permissions, is_active, last_used_at, expires_at, created_at')
      .order('created_at', { ascending: false });
    if (!error) setKeys((data || []) as ApiKey[]);
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, []);

  const generateApiKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'ujm_';
    for (let i = 0; i < 48; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
  };

  const hashKey = async (key: string): Promise<string> => {
    const enc = new TextEncoder().encode(key);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) { toast.error('Nom requis'); return; }
    const rawKey = generateApiKey();
    const keyHash = await hashKey(rawKey);
    const prefix = rawKey.substring(0, 8) + '...';

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('api_keys').insert({
      key_hash: keyHash,
      key_prefix: prefix,
      name: newKeyName,
      permissions: newKeyPerms,
      created_by: user.id,
    } as any);

    if (error) { toast.error('Erreur: ' + error.message); return; }

    setGeneratedKey(rawKey);
    setShowCreate(false);
    setNewKeyName('');
    setNewKeyPerms(['login']);
    fetchKeys();
    toast.success('Clé API créée !');
  };

  const toggleKey = async (id: string, active: boolean) => {
    await supabase.from('api_keys').update({ is_active: active } as any).eq('id', id);
    fetchKeys();
    toast.success(active ? 'Clé activée' : 'Clé désactivée');
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Supprimer cette clé API ?')) return;
    await supabase.from('api_keys').delete().eq('id', id);
    fetchKeys();
    toast.success('Clé supprimée');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié !');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Code className="h-5 w-5" /> API Mobile & Développeurs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les clés d'accès API pour l'application mobile native
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvelle clé
        </Button>
      </div>

      {/* Base URL */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-xs text-muted-foreground">URL de base de l'API</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
              {API_BASE_URL}
            </code>
            <Button size="icon" variant="outline" onClick={() => copyToClipboard(API_BASE_URL)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated key alert */}
      {generatedKey && (
        <Card className="border-2 border-amber-500 bg-amber-50">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-800">
              ⚠️ Copiez cette clé maintenant ! Elle ne sera plus affichée.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-3 py-2 rounded text-sm font-mono break-all">
                {showKey ? generatedKey : '••••••••••••••••••••••••'}
              </code>
              <Button size="icon" variant="outline" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedKey)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setGeneratedKey(null); setShowKey(false); }}>
              Fermer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une clé API</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de la clé</Label>
              <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Ex: App Mobile iOS" />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="space-y-2 mt-2">
                {AVAILABLE_PERMISSIONS.map(p => (
                  <div key={p.id} className="flex items-start gap-2">
                    <Checkbox
                      checked={newKeyPerms.includes(p.id)}
                      onCheckedChange={(checked) => {
                        setNewKeyPerms(prev =>
                          checked ? [...prev, p.id] : prev.filter(x => x !== p.id)
                        );
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full">Générer la clé</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keys list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Chargement...</p>
        ) : keys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune clé API. Créez-en une pour commencer.</p>
            </CardContent>
          </Card>
        ) : (
          keys.map(k => (
            <Card key={k.id} className={!k.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{k.name || 'Sans nom'}</span>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{k.key_prefix}</code>
                    {k.permissions.map(p => (
                      <Badge key={p} variant={p === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Créée le {new Date(k.created_at).toLocaleDateString('fr')}
                    {k.last_used_at && ` • Dernière utilisation : ${new Date(k.last_used_at).toLocaleDateString('fr')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={k.is_active} onCheckedChange={(v) => toggleKey(k.id, v)} />
                  <Button size="icon" variant="ghost" onClick={() => deleteKey(k.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick doc */}
      <Tabs defaultValue="endpoints">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="example">Exemples</TabsTrigger>
        </TabsList>
        <TabsContent value="endpoints">
          <Card>
            <CardContent className="p-4 space-y-3 text-sm">
              <h3 className="font-semibold">🔓 Endpoints publics (permission: login)</h3>
              <div className="bg-muted rounded p-3 font-mono text-xs space-y-1">
                <p><Badge variant="secondary" className="text-[10px]">POST</Badge> /auth/login — Connexion</p>
                <p><Badge variant="secondary" className="text-[10px]">POST</Badge> /auth/refresh — Rafraîchir le token</p>
                <p><Badge variant="secondary" className="text-[10px]">POST</Badge> /auth/me — Profil utilisateur connecté</p>
              </div>
              <h3 className="font-semibold mt-4">🔒 Endpoints admin (permission: admin)</h3>
              <div className="bg-muted rounded p-3 font-mono text-xs space-y-1">
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /users — Liste des utilisateurs</p>
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /users/:id — Détails utilisateur</p>
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /prices — Liste des prix</p>
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /events — Liste des événements</p>
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /content — Contenu (annonces, services...)</p>
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /gastronomy — Restaurants & hébergements</p>
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /enterprises — Profils entreprises</p>
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /freelancers — Profils freelancers</p>
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /diaspora — Projets diaspora</p>
                <p><Badge variant="destructive" className="text-[10px]">POST</Badge> /notifications — Envoyer notification</p>
                <p><Badge variant="destructive" className="text-[10px]">GET</Badge> /stats — Statistiques globales</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="example">
          <Card>
            <CardContent className="p-4">
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre">
{`// Login
const res = await fetch("${API_BASE_URL}/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "ujm_votre_cle_api"
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "motdepasse"
  })
});
const data = await res.json();
// → { access_token, refresh_token, user: { id, email, username, avatar_url, bio } }

// Profil (avec bearer token)
const me = await fetch("${API_BASE_URL}/auth/me", {
  method: "POST",
  headers: {
    "x-api-key": "ujm_votre_cle_api",
    "Authorization": "Bearer " + data.access_token
  }
});`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
