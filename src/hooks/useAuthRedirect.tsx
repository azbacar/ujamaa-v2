import { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useRole } from './useRole';

export const useAuthRedirect = () => {
  const { user, session } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!user || !session || roleLoading) return;

    // Don't redirect on password reset pages
    if (location.pathname.startsWith('/auth/reset')) {
      return;
    }

    // Priorité 1 : paramètre ?redirect=... (chemin où l'utilisateur voulait aller)
    const redirectParam = searchParams.get('redirect');
    let redirectPath: string;

    if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
      redirectPath = redirectParam;
    } else {
      // Priorité 2 : admins/moderators → /admin, sinon → /
      redirectPath = role === 'admin' || role === 'moderator' ? '/admin' : '/';
    }

    setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 300);
  }, [user, session, role, roleLoading, navigate, location.pathname, searchParams]);
};
