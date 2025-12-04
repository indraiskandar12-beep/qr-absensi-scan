import { useState } from 'react';
import { Download, Filter, Calendar } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Reports = () => {
  const { students, attendances } = useAppStore();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get unique classes
  const uniqueClasses = [...new Set(students.map(s => s.class_name))];

  // Filter attendances
  const filteredAttendances = attendances.filter(a => {
    const student = students.find(s => s.id === a.student_id);
    
    if (dateFilter && a.attendance_date !== dateFilter) return false;
    if (classFilter !== 'all' && student?.class_name !== classFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    
    return true;
  });

  const getStudentDetails = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['No', 'NISN', 'Nama', 'Kelas', 'Tanggal', 'Waktu Masuk', 'Status'];
    const rows = filteredAttendances.map((a, index) => {
      const student = getStudentDetails(a.student_id);
      return [
        index + 1,
        student?.nisn || '-',
        student?.full_name || '-',
        student?.class_name || '-',
        a.attendance_date,
        a.time_in,
        a.status,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rekap-absensi-${dateFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Data berhasil diekspor!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Hadir':
        return <Badge className="bg-success text-success-foreground">Hadir</Badge>;
      case 'Izin':
        return <Badge className="bg-info text-info-foreground">Izin</Badge>;
      case 'Sakit':
        return <Badge className="bg-warning text-warning-foreground">Sakit</Badge>;
      case 'Alpha':
        return <Badge className="bg-destructive text-destructive-foreground">Alpha</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rekap Absensi</h1>
            <p className="text-muted-foreground mt-1">
              Laporan dan rekap data kehadiran siswa
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {uniqueClasses.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Data Absensi ({filteredAttendances.length} record)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAttendances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Tidak ada data absensi untuk filter yang dipilih</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>NISN</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Waktu Masuk</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendances.map((attendance, index) => {
                      const student = getStudentDetails(attendance.student_id);
                      return (
                        <TableRow key={attendance.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {student?.nisn || '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student?.full_name || '-'}
                          </TableCell>
                          <TableCell>{student?.class_name || '-'}</TableCell>
                          <TableCell>{attendance.attendance_date}</TableCell>
                          <TableCell>{attendance.time_in}</TableCell>
                          <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                        </TableRow>
                      );
                    })}
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

export default Reports;
