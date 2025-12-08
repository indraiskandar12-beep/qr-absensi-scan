import { Users, UserCheck, UserX, Clock, LogOut, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import StatCard from '@/components/dashboard/StatCard';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import LateStudentsNotification from '@/components/dashboard/LateStudentsNotification';
import { useStudents } from '@/hooks/useStudents';
import { useTodayAttendances } from '@/hooks/useAttendances';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import schoolLogoDefault from '@/assets/school-logo.png';

const Dashboard = () => {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: todayAttendances = [], isLoading: loadingAttendances } = useTodayAttendances();
  const { data: schoolSettings } = useSchoolSettings();
  
  const lateTime = schoolSettings?.late_time || '07:30:00';
  const activeStudents = students.filter(s => s.is_active);
  const presentToday = todayAttendances.filter(a => a.status === 'Hadir').length;
  const lateToday = todayAttendances.filter(a => a.time_in > lateTime).length;
  const checkedOutToday = todayAttendances.filter(a => a.time_out !== null).length;
  const absentToday = activeStudents.length - todayAttendances.length;

  if (loadingStudents || loadingAttendances) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Logo */}
        <div className="flex items-center gap-4">
          <img 
            src={schoolSettings?.school_logo_url || schoolLogoDefault} 
            alt="Logo Sekolah" 
            className="w-16 h-16 object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {schoolSettings?.school_name || 'Dashboard'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Selamat datang! Ini adalah ringkasan data absensi hari ini.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Siswa Aktif"
            value={activeStudents.length}
            icon={Users}
            variant="blue"
            subtitle="Siswa terdaftar"
          />
          <StatCard
            title="Hadir Hari Ini"
            value={presentToday}
            icon={UserCheck}
            variant="green"
            subtitle="Sudah absen datang"
          />
          <StatCard
            title="Terlambat"
            value={lateToday}
            icon={AlertTriangle}
            variant="yellow"
            subtitle={`Setelah ${lateTime.slice(0,5)}`}
          />
          <StatCard
            title="Sudah Pulang"
            value={checkedOutToday}
            icon={LogOut}
            variant="orange"
            subtitle="Sudah absen pulang"
          />
          <StatCard
            title="Belum Hadir"
            value={absentToday < 0 ? 0 : absentToday}
            icon={UserX}
            variant="red"
            subtitle="Belum absen"
          />
          <StatCard
            title="Persentase"
            value={activeStudents.length > 0 ? Math.round((presentToday / activeStudents.length) * 100) + '%' : '0%'}
            icon={Clock}
            variant="purple"
            subtitle="Kehadiran hari ini"
          />
        </div>

        {/* Charts and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceChart lateTime={lateTime} />
          <LateStudentsNotification lateTime={lateTime} />
        </div>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Absensi Terbaru Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada absensi hari ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jam Datang</TableHead>
                      <TableHead>Jam Pulang</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAttendances.slice(0, 10).map((attendance, index) => (
                      <TableRow key={attendance.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{attendance.student?.full_name || '-'}</TableCell>
                        <TableCell>{attendance.student?.class_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {attendance.time_in}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {attendance.time_out ? (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                              {attendance.time_out}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-success text-success-foreground">
                            {attendance.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
