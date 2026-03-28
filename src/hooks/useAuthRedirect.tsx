import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useRole } from './useRole';

export const useAuthRedirect = () => {
  const { user, session } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user || !session || roleLoading) return;

    // Don't redirect on password reset pages
    if (location.pathname.startsWith('/auth/reset')) {
      return;
    }

    // Redirect admins/moderators to admin dashboard
    const redirectPath = role === 'admin' || role === 'moderator' ? '/admin' : '/';

    setTimeout(() => {
      navigate(redirectPath);
    }, 500);

  }, [user, session, role, roleLoading, navigate, location.pathname]);
};
