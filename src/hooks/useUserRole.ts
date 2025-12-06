import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { UserRole } from '@/types';

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: userRole, isLoading, error } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserRole | null;
    },
    enabled: !!user?.id,
  });

  const isAdmin = userRole?.role === 'admin';
  const isPetugas = userRole?.role === 'petugas';
  const hasRole = !!userRole;

  return {
    userRole,
    isAdmin,
    isPetugas,
    hasRole,
    isLoading,
    error,
  };
};
