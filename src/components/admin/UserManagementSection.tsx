import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Crown, 
  ShieldCheck, 
  User,
  Search,
  Mail,
  Settings,
  UserPlus,
  Megaphone
} from 'lucide-react';

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

export default function UserManagementSection({
  users,
  selectedUser,
  selectedRole,
  onUserSelect,
  onRoleSelect,
  onRoleAssign
}: UserManagementSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
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
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Role Assignment Card */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Gestion des rôles utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="user">Utilisateur</Label>
              <Select value={selectedUser} onValueChange={onUserSelect}>
                <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500">
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.username} ({user.email})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select value={selectedRole} onValueChange={onRoleSelect}>
                <SelectTrigger className="border-blue-200 bg-white focus:ring-blue-500">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-red-500" />
                      Administrateur
                    </div>
                  </SelectItem>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      Modérateur
                    </div>
                  </SelectItem>
                  <SelectItem value="annonceur">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-green-600" />
                      Annonceur
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Utilisateur
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={onRoleAssign}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Assigner le rôle
          </Button>
        </CardContent>
      </Card>

      {/* Users List Card */}
      <Card className="border-blue-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des utilisateurs
            </CardTitle>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              {users.length} utilisateurs
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200 bg-white focus:ring-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="border-blue-100 bg-gradient-to-r from-white to-blue-50 hover:shadow-md transition-all duration-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.username}</p>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user.user_roles.map((roleData, index) => (
                        <Badge 
                          key={index} 
                          className={`flex items-center gap-1 ${getRoleBadgeVariant(roleData.role)}`}
                        >
                          {getRoleIcon(roleData.role)}
                          {roleData.role}
                        </Badge>
                      ))}
                      {user.user_roles.length === 0 && (
                        <Badge className="flex items-center gap-1 bg-slate-100 text-slate-600 border-slate-200">
                          <User className="h-4 w-4" />
                          user
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