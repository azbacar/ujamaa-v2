import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Settings, User, Shield, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ProfilePage = () => {
  const { user } = useAuth();
  const { role } = useRole();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p>Vous devez être connecté pour accéder à cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleDisplayName = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'Administrateur';
      case 'moderator':
        return 'Modérateur';
      case 'user':
      default:
        return 'Utilisateur';
    }
  };

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles et préférences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user.email}</h3>
                    <Badge variant={getRoleBadgeVariant(role)}>
                      {getRoleDisplayName(role)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      value={user.email || ''}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="created">Membre depuis</Label>
                    <Input
                      id="created"
                      value={new Date(user.created_at).toLocaleDateString('fr-FR')}
                      disabled
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isEditing ? 'Annuler' : 'Modifier'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations du compte */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Statut du compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rôle</span>
                    <Badge variant={getRoleBadgeVariant(role)}>
                      {getRoleDisplayName(role)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email vérifié</span>
                    <Badge variant={user.email_confirmed_at ? 'default' : 'outline'}>
                      {user.email_confirmed_at ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dernière connexion</span>
                    <span className="text-sm">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')
                        : 'Jamais'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/auth/forgot'}>
                  Changer le mot de passe
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/pro'}>
                  🔥 Passer à UJAMAA Pro
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Préférences de notification
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Historique d'activité
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;