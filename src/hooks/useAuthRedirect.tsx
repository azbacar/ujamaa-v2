import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useRole } from './useRole';
import { toast } from 'sonner';

export const useAuthRedirect = () => {
  const { user, session } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user || !session || roleLoading) return;

    // Ne pas rediriger si on est sur une page de reset de mot de passe
    if (location.pathname.startsWith('/auth/reset')) {
      return;
    }

    // Message de bienvenue avec le niveau d'accès
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

    // Afficher le message de bienvenue
    toast.success(`Bienvenue ! Vous êtes connecté en tant que ${getRoleDisplayName(role)}.`, {
      duration: 4000,
    });

    // Redirection automatique vers le tableau de bord admin pour les admins/modérateurs
    const redirectPath = role === 'admin' || role === 'moderator' ? '/admin' : '/';
    
    // Délai pour permettre à l'utilisateur de voir le message
    setTimeout(() => {
      navigate(redirectPath);
    }, 1500);

  }, [user, session, role, roleLoading, navigate, location.pathname]);
};