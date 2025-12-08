import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';

export interface DailyAttendanceStats {
  date: string;
  dayName: string;
  hadir: number;
  terlambat: number;
  alpha: number;
}

export const useWeeklyAttendances = (lateTime: string = '07:30:00') => {
  return useQuery({
    queryKey: ['attendances', 'weekly', lateTime],
    queryFn: async () => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
      
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendances')
        .select('attendance_date, time_in, status')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);
      
      if (error) throw error;
      
      // Get total active students
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('is_active', true);
      
      const totalStudents = students?.length || 0;
      
      // Process data by day
      const dailyStats: DailyAttendanceStats[] = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = subDays(weekEnd, 6 - i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayName = format(currentDate, 'EEE', { locale: id });
        
        const dayAttendances = data?.filter(a => a.attendance_date === dateStr) || [];
        const hadir = dayAttendances.filter(a => a.time_in <= lateTime).length;
        const terlambat = dayAttendances.filter(a => a.time_in > lateTime).length;
        const alpha = totalStudents - dayAttendances.length;
        
        dailyStats.push({
          date: dateStr,
          dayName,
          hadir,
          terlambat: terlambat < 0 ? 0 : terlambat,
          alpha: alpha < 0 ? 0 : alpha,
        });
      }
      
      return dailyStats;
    },
  });
};

export const useLateStudentsToday = (lateTime: string = '07:30:00') => {
  return useQuery({
    queryKey: ['attendances', 'late-today', lateTime],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          *,
          student:students(*)
        `)
        .eq('attendance_date', today)
        .gt('time_in', lateTime)
        .order('time_in', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};
