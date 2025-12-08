import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLateStudentsToday } from '@/hooks/useWeeklyAttendances';
import { Skeleton } from '@/components/ui/skeleton';

interface LateStudentsNotificationProps {
  lateTime?: string;
}

const LateStudentsNotification = ({ lateTime = '07:30:00' }: LateStudentsNotificationProps) => {
  const { data: lateStudents = [], isLoading } = useLateStudentsToday(lateTime);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const calculateLateMinutes = (timeIn: string) => {
    const [lateHours, lateMinutes] = lateTime.split(':').map(Number);
    const [inHours, inMinutes] = timeIn.split(':').map(Number);
    
    const lateTimeInMinutes = lateHours * 60 + lateMinutes;
    const timeInMinutes = inHours * 60 + inMinutes;
    
    return timeInMinutes - lateTimeInMinutes;
  };

  if (isLoading) {
    return (
      <Card className="border-warning/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-5 h-5" />
            Siswa Terlambat Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (lateStudents.length === 0) {
    return (
      <Card className="border-success/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-success">
            <Clock className="w-5 h-5" />
            Siswa Terlambat Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Clock className="w-12 h-12 mb-3 opacity-50" />
            <p>Tidak ada siswa terlambat hari ini</p>
            <p className="text-sm">Batas waktu: {formatTime(lateTime)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-warning">
          <AlertTriangle className="w-5 h-5" />
          Siswa Terlambat Hari Ini
          <Badge variant="destructive" className="ml-auto">
            {lateStudents.length} siswa
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Batas waktu masuk: <strong>{formatTime(lateTime)}</strong>
        </p>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {lateStudents.map((attendance) => {
              const lateMinutes = calculateLateMinutes(attendance.time_in);
              return (
                <div 
                  key={attendance.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {attendance.student?.full_name || '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {attendance.student?.class_name} • {attendance.student?.major}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant="outline" className="bg-warning/20 text-warning-foreground border-warning/30">
                      {formatTime(attendance.time_in)}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      +{lateMinutes} menit
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LateStudentsNotification;
