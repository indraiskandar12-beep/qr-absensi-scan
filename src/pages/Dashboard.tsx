import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import StatCard from '@/components/dashboard/StatCard';
import { useAppStore } from '@/store/useAppStore';
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

const Dashboard = () => {
  const { students, getTodayAttendances } = useAppStore();
  const todayAttendances = getTodayAttendances();
  
  const activeStudents = students.filter(s => s.is_active);
  const presentToday = todayAttendances.filter(a => a.status === 'Hadir').length;
  const absentToday = activeStudents.length - todayAttendances.length;

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.full_name || 'Unknown';
  };

  const getStudentClass = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.class_name || '-';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Selamat datang! Ini adalah ringkasan data absensi hari ini.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            subtitle="Sudah absen"
          />
          <StatCard
            title="Belum Hadir"
            value={absentToday}
            icon={UserX}
            variant="red"
            subtitle="Belum absen"
          />
          <StatCard
            title="Persentase"
            value={activeStudents.length > 0 ? Math.round((presentToday / activeStudents.length) * 100) + '%' : '0%'}
            icon={Clock}
            variant="yellow"
            subtitle="Kehadiran hari ini"
          />
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
                      <TableHead>Waktu Masuk</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAttendances.slice(0, 10).map((attendance, index) => (
                      <TableRow key={attendance.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{getStudentName(attendance.student_id)}</TableCell>
                        <TableCell>{getStudentClass(attendance.student_id)}</TableCell>
                        <TableCell>{attendance.time_in}</TableCell>
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
