import { useState } from 'react';
import { Download, Filter, Calendar } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useStudents } from '@/hooks/useStudents';
import { useAttendances } from '@/hooks/useAttendances';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const Reports = () => {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: attendances = [], isLoading: loadingAttendances } = useAttendances(dateFilter);

  const uniqueClasses = [...new Set(students.map(s => s.class_name))];

  const filteredAttendances = attendances.filter(a => {
    if (classFilter !== 'all' && a.student?.class_name !== classFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const handleExport = () => {
    const headers = ['No', 'NISN', 'Nama', 'Kelas', 'Tanggal', 'Waktu Masuk', 'Status'];
    const rows = filteredAttendances.map((a, index) => [
      index + 1, a.student?.nisn || '-', a.student?.full_name || '-', a.student?.class_name || '-',
      a.attendance_date, a.time_in, a.status
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rekap-absensi-${dateFilter}.csv`;
    link.click();
    toast.success('Data berhasil diekspor!');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = { Hadir: 'bg-success', Izin: 'bg-info', Sakit: 'bg-warning', Alpha: 'bg-destructive' };
    return <Badge className={`${variants[status] || ''} text-white`}>{status}</Badge>;
  };

  if (loadingStudents || loadingAttendances) return <AdminLayout><Skeleton className="h-96" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Rekap Absensi</h1>
            <p className="text-muted-foreground mt-1">Laporan data kehadiran siswa</p>
          </div>
          <Button onClick={handleExport} variant="outline"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" />Filter Data</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="Hadir">Hadir</SelectItem>
                    <SelectItem value="Izin">Izin</SelectItem>
                    <SelectItem value="Sakit">Sakit</SelectItem>
                    <SelectItem value="Alpha">Alpha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Data Absensi ({filteredAttendances.length})</CardTitle></CardHeader>
          <CardContent>
            {filteredAttendances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Tidak ada data</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>No</TableHead><TableHead>NISN</TableHead><TableHead>Nama</TableHead><TableHead>Kelas</TableHead><TableHead>Tanggal</TableHead><TableHead>Waktu</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendances.map((a, index) => (
                    <TableRow key={a.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{a.student?.nisn || '-'}</TableCell>
                      <TableCell className="font-medium">{a.student?.full_name || '-'}</TableCell>
                      <TableCell>{a.student?.class_name || '-'}</TableCell>
                      <TableCell>{a.attendance_date}</TableCell>
                      <TableCell>{a.time_in}</TableCell>
                      <TableCell>{getStatusBadge(a.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reports;
