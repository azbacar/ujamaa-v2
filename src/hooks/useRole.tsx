import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'moderator' | 'user' | 'annonceur';

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole('user');
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_role', { _user_id: user.id });

        if (error) {
          logger.error('Error fetching user role', error);
          setRole('user');
        } else {
          setRole((data as UserRole) || 'user');
        }
      } catch (error) {
        logger.error('Error fetching user role', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const hasRole = (requiredRole: UserRole): boolean => {
    const roleHierarchy = { admin: 4, moderator: 3, annonceur: 2, user: 1 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const isAdmin = () => role === 'admin';
  const isModerator = () => role === 'moderator' || role === 'admin';
  const isAnnonceur = () => role === 'annonceur' || role === 'moderator' || role === 'admin';
  const isUser = () => role === 'user';

  return {
    role,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isAnnonceur,
    isUser
  };
};