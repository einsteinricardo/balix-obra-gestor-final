import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'moderator' | 'user';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Call the security definer function to get user's primary role
        const { data, error } = await supabase.rpc('get_user_role', {
          _user_id: user.id
        });

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user'); // Default to 'user' role on error
        } else {
          setRole(data as AppRole);
        }
      } catch (error) {
        console.error('Error in useUserRole:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  const hasRole = (requiredRole: AppRole): boolean => {
    if (!role) return false;
    
    const roleHierarchy: Record<AppRole, number> = {
      admin: 3,
      moderator: 2,
      user: 1
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  return { role, loading, hasRole };
};
