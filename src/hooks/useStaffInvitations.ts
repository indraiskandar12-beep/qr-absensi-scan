import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StaffInvitation } from '@/types';
import { toast } from 'sonner';

export const useStaffInvitations = () => {
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading, error } = useQuery({
    queryKey: ['staffInvitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .is('used_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StaffInvitation[];
    },
  });

  const createInvitation = useMutation({
    mutationFn: async (invitation: { email: string; full_name: string; role: 'admin' | 'petugas' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('staff_invitations')
        .insert({
          email: invitation.email,
          full_name: invitation.full_name,
          role: invitation.role,
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffInvitations'] });
      toast.success('Undangan berhasil dibuat!');
    },
    onError: (error: Error) => {
      toast.error('Gagal membuat undangan', {
        description: error.message,
      });
    },
  });

  const deleteInvitation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffInvitations'] });
      toast.success('Undangan berhasil dihapus!');
    },
    onError: (error: Error) => {
      toast.error('Gagal menghapus undangan', {
        description: error.message,
      });
    },
  });

  return {
    invitations,
    isLoading,
    error,
    createInvitation,
    deleteInvitation,
  };
};
