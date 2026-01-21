import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { History, LogIn, LogOut, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ScanHistoryItem {
  id: string;
  student_id: string;
  time_in: string;
  time_out: string | null;
  status: string;
  created_at: string;
  student: {
    full_name: string;
    class_name: string;
  };
}

const ScanHistory = () => {
  const { data: recentScans, isLoading } = useQuery({
    queryKey: ['recent-scans'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          id,
          student_id,
          time_in,
          time_out,
          status,
          created_at,
          students!inner(full_name, class_name)
        `)
        .eq('attendance_date', today)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        student: {
          full_name: (item.students as any).full_name,
          class_name: (item.students as any).class_name,
        }
      })) as ScanHistoryItem[];
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mt-6">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <History className="w-4 h-4" />
          <span className="text-sm font-medium">Riwayat Scan Terakhir</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!recentScans || recentScans.length === 0) {
    return (
      <div className="w-full max-w-md mt-6">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <History className="w-4 h-4" />
          <span className="text-sm font-medium">Riwayat Scan Terakhir</span>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground text-sm">
          Belum ada riwayat scan hari ini
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mt-6">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <History className="w-4 h-4" />
        <span className="text-sm font-medium">Riwayat Scan Terakhir</span>
      </div>
      <div className="space-y-2">
        {recentScans.map((scan) => (
          <div
            key={scan.id}
            className="bg-card border rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              scan.time_out ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
            )}>
              {scan.time_out ? (
                <LogOut className="w-5 h-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{scan.student.full_name}</p>
              <p className="text-xs text-muted-foreground">{scan.student.class_name}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="font-mono">
                  {scan.time_out ? formatTime(scan.time_out) : formatTime(scan.time_in)}
                </span>
              </div>
              <span className={cn(
                "text-xs font-medium",
                scan.status === 'Hadir' && "text-success",
                scan.status === 'Terlambat' && "text-warning"
              )}>
                {scan.time_out ? 'Pulang' : scan.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScanHistory;
