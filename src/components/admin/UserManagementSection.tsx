import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Users, Crown, ShieldCheck, User, Search, Mail, Settings, UserPlus, Megaphone, Zap, CheckCircle, Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  username: string;
  user_roles: { role: string }[];
}

interface UserManagementSectionProps {
  users: UserWithRole[];
  selectedUser: string;
  selectedRole: string;
  onUserSelect: (userId: string) => void;
  onRoleSelect: (role: string) => void;
  onRoleAssign: () => void;
}

const PRIVILEGES = [
  { key: 'pro', label: 'PRO', icon: Crown, color: 'text-amber-500' },
  { key: 'verified', label: 'Vérifié', icon: CheckCircle, color: 'text-blue-500' },
  { key: 'boost_ia', label: 'Boost IA', icon: Zap, color: 'text-purple-500' },
  { key: 'contact_direct', label: 'Contact Direct', icon: Phone, color: 'text-green-500' },
];

export default function UserManagementSection({
  users, selectedUser, selectedRole, onUserSelect, onRoleSelect, onRoleAssign
}: UserManagementSectionProps) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [privilegeUser, setPrivilegeUser] = useState('');
  const [userPrivileges, setUserPrivileges] = useState<Record<string, boolean>>({});
  const [loadingPrivileges, setLoadingPrivileges] = useState(false);

  useEffect(() => {
    if (privilegeUser) fetchPrivileges(privilegeUser);
  }, [privilegeUser]);

  const fetchPrivileges = async (userId: string) => {
    setLoadingPrivileges(true);
    const { data } = await supabase
      .from('announcer_privileges')
      .select('privilege, is_active')
      .eq('user_id', userId);
    
    const map: Record<string, boolean> = {};
    PRIVILEGES.forEach(p => { map[p.key] = false; });
    (data || []).forEach(d => { map[d.privilege] = d.is_active; });
    setUserPrivileges(map);
    setLoadingPrivileges(false);
  };

  const togglePrivilege = async (privilege: string, active: boolean) => {
    if (!privilegeUser || !currentUser) return;
    try {
      // Garde-fou : "Vérifié" exige une demande KYC approuvée (verification_requests)
      if (privilege === 'verified' && active) {
        const { data: req } = await supabase
          .from('verification_requests')
          .select('id')
          .eq('user_id', privilegeUser)
          .eq('status', 'approved')
          .limit(1)
          .maybeSingle();
        if (!req) {
          const ok = window.confirm(
            "⚠️ Cet utilisateur n'a AUCUNE demande de vérification approuvée (KYC).\n\n" +
            "Activer manuellement le badge « Vérifié » sans pièce justificative est déconseillé.\n\n" +
            "Voulez-vous vraiment continuer ?"
          );
          if (!ok) return;
        }
      }

      const { data: existing } = await supabase
        .from('announcer_privileges')
        .select('id')
        .eq('user_id', privilegeUser)
        .eq('privilege', privilege)
        .maybeSingle();

      if (existing) {
        await supabase.from('announcer_privileges').update({ is_active: active }).eq('id', existing.id);
      } else {
        await supabase.from('announcer_privileges').insert({
          user_id: privilegeUser,
          privilege,
          is_active: active,
          granted_by: currentUser.id,
        });
      }
      setUserPrivileges(prev => ({ ...prev, [privilege]: active }));
      toast.success(`Privilège ${active ? 'activé' : 'désactivé'}`);
    } catch {
      toast.error('Erreur');
    }
  };
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'moderator': return <ShieldCheck className="h-4 w-4" />;
      case 'annonceur': return <Megaphone className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-50 text-red-600 border-red-200';
      case 'moderator': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'annonceur': return 'bg-green-50 text-green-600 border-green-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Role Assignment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Gestion des rôles utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Utilisateur</Label>
              <Select value={selectedUser} onValueChange={onUserSelect}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un utilisateur" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" /> {u.username} ({u.email})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rôle</Label>
              <Select value={selectedRole} onValueChange={onRoleSelect}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin"><div className="flex items-center gap-2"><Crown className="h-4 w-4 text-red-500" /> Administrateur</div></SelectItem>
                  <SelectItem value="moderator"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600" /> Modérateur</div></SelectItem>
                  <SelectItem value="annonceur"><div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-green-600" /> Annonceur</div></SelectItem>
                  <SelectItem value="user"><div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Utilisateur</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={onRoleAssign}>
            <Settings className="h-4 w-4 mr-2" /> Assigner le rôle
          </Button>
        </CardContent>
      </Card>

      {/* Privilege Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Gestion des privilèges annonceur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Sélectionner un annonceur</Label>
            <Select value={privilegeUser} onValueChange={setPrivilegeUser}>
              <SelectTrigger><SelectValue placeholder="Choisir un utilisateur..." /></SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.username} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {privilegeUser && !loadingPrivileges && (
            <div className="space-y-3">
              {PRIVILEGES.map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${p.color}`} />
                      <span className="font-medium">{p.label}</span>
                    </div>
                    <Switch
                      checked={userPrivileges[p.key] || false}
                      onCheckedChange={(checked) => togglePrivilege(p.key, checked)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
              <Users className="h-5 w-5" /> Liste des utilisateurs
            </CardTitle>
            <Badge variant="outline">{users.length} utilisateurs</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="hover:shadow-md transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{u.username}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" /> {u.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {u.user_roles.map((roleData, index) => (
                        <Badge key={index} className={`flex items-center gap-1 ${getRoleBadgeVariant(roleData.role)}`}>
                          {getRoleIcon(roleData.role)} {roleData.role}
                        </Badge>
                      ))}
                      {u.user_roles.length === 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <User className="h-4 w-4" /> user
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}