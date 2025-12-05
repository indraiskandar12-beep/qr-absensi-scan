import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SchoolSettings {
  id: string;
  school_name: string;
  school_address: string | null;
  school_logo_url: string | null;
  school_phone: string | null;
  school_email: string | null;
  created_at: string;
  updated_at: string;
}

export const useSchoolSettings = () => {
  return useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as SchoolSettings;
    },
  });
};

export const useUpdateSchoolSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: Partial<SchoolSettings>) => {
      const { data: existing } = await supabase
        .from('school_settings')
        .select('id')
        .single();
      
      if (!existing) throw new Error('Settings not found');
      
      const { data, error } = await supabase
        .from('school_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as SchoolSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
      toast.success('Pengaturan berhasil disimpan!');
    },
    onError: (error) => {
      toast.error('Gagal menyimpan pengaturan: ' + error.message);
    },
  });
};
