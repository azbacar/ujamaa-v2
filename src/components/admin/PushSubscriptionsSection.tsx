import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Send, RefreshCw, Smartphone, Globe, Apple } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Sub = {
  id: string;
  user_id: string;
  platform: 'web' | 'ios' | 'android';
  endpoint: string | null;
  native_token: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string | null;
  user_name?: string | null;
};

const PLATFORMS = ['all', 'web', 'ios', 'android'] as const;

export default function PushSubscriptionsSection() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, platform, endpoint, native_token, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); setLoading(false); return; }

    const ids = Array.from(new Set((data || []).map((s: any) => s.user_id)));
    const usersMap = new Map<string, { email: string | null; username: string | null }>();
    if (ids.length) {
      const { data: users } = await supabase.from('users').select('id, email, username').in('id', ids);
      (users || []).forEach((u: any) => usersMap.set(u.id, { email: u.email, username: u.username }));
    }
    setSubs((data || []).map((s: any) => ({
      ...s,
      user_email: usersMap.get(s.user_id)?.email || null,
      user_name: usersMap.get(s.user_id)?.username || null,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (platform !== 'all' && s.platform !== platform) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.user_email?.toLowerCase().includes(q) ||
          s.user_name?.toLowerCase().includes(q) ||
          s.user_id.includes(q)
        );
      }
      return true;
    });
  }, [subs, search, platform]);

  const grouped = useMemo(() => {
    const map = new Map<string, Sub[]>();
    filtered.forEach((s) => {
      const arr = map.get(s.user_id) || [];
      arr.push(s); map.set(s.user_id, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const stats = useMemo(() => ({
    total: subs.length,
    web: subs.filter((s) => s.platform === 'web').length,
    ios: subs.filter((s) => s.platform === 'ios').length,
    android: subs.filter((s) => s.platform === 'android').length,
    users: new Set(subs.map((s) => s.user_id)).size,
  }), [subs]);

  const sendTest = async (sub: Sub) => {
    setBusyId(sub.id);
    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        title: '🔔 Notification test',
        body: `Test envoyé depuis l'admin (${sub.platform})`,
        url: '/',
        user_ids: [sub.user_id],
      },
    });
    setBusyId(null);
    if (error) toast({ title: 'Erreur envoi', description: error.message, variant: 'destructive' });
    else toast({ title: 'Envoyé', description: 'Notification test transmise.' });
  };

  const remove = async (sub: Sub) => {
    if (!confirm('Supprimer cet abonnement push ?')) return;
    setBusyId(sub.id);
    const { error } = await supabase.from('push_subscriptions').delete().eq('id', sub.id);
    setBusyId(null);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Supprimé' });
    load();
  };

  const platformIcon = (p: string) => p === 'ios' ? <Apple className="h-3 w-3" /> : p === 'android' ? <Smartphone className="h-3 w-3" /> : <Globe className="h-3 w-3" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Utilisateurs', value: stats.users },
          { label: 'Web', value: stats.web },
          { label: 'iOS', value: stats.ios },
          { label: 'Android', value: stats.android },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-bold">{s.value}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Abonnements Push</CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Actualiser
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Rechercher (email, nom, user_id)" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p === 'all' ? 'Toutes plateformes' : p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading && <div className="text-sm text-muted-foreground">Chargement…</div>}
          {!loading && grouped.length === 0 && <div className="text-sm text-muted-foreground">Aucun abonnement.</div>}

          <div className="space-y-4">
            {grouped.map(([userId, list]) => (
              <div key={userId} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{list[0].user_name || list[0].user_email || userId.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{list[0].user_email}</div>
                  </div>
                  <Badge variant="secondary">{list.length} appareil(s)</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plateforme</TableHead>
                      <TableHead>Identifiant</TableHead>
                      <TableHead>Mis à jour</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">{platformIcon(s.platform)}{s.platform}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-xs truncate">
                          {s.endpoint || s.native_token || '—'}
                        </TableCell>
                        <TableCell className="text-xs">{new Date(s.updated_at).toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" disabled={busyId === s.id || s.platform !== 'web'} onClick={() => sendTest(s)} title={s.platform !== 'web' ? 'Envoi natif (iOS/Android) en cours d\'intégration' : 'Envoyer une notification test'}>
                            <Send className="h-3 w-3 mr-1" />Test
                          </Button>
                          <Button size="sm" variant="destructive" disabled={busyId === s.id} onClick={() => remove(s)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
