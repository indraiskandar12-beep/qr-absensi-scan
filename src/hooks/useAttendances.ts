import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Attendance } from '@/types';
import { toast } from 'sonner';

export const useAttendances = (date?: string) => {
  return useQuery({
    queryKey: ['attendances', date],
    queryFn: async () => {
      let query = supabase
        .from('attendances')
        .select(`
          *,
          student:students(*)
        `)
        .order('time_in', { ascending: false });
      
      if (date) {
        query = query.eq('attendance_date', date);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Attendance[];
    },
  });
};

export const useTodayAttendances = () => {
  const today = new Date().toISOString().split('T')[0];
  return useAttendances(today);
};

export const useRecordAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (studentId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toLocaleTimeString('en-GB', { hour12: false });
      
      // Check if already attended today
      const { data: existing } = await supabase
        .from('attendances')
        .select('id')
        .eq('student_id', studentId)
        .eq('attendance_date', today)
        .maybeSingle();
      
      if (existing) {
        throw new Error('ALREADY_ATTENDED');
      }
      
      const { data, error } = await supabase
        .from('attendances')
        .insert({
          student_id: studentId,
          attendance_date: today,
          time_in: now,
          status: 'Hadir',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Attendance> & { id: string }) => {
      const { data, error } = await supabase
        .from('attendances')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      toast.success('Absensi berhasil diperbarui!');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui absensi: ' + error.message);
    },
  });
};
