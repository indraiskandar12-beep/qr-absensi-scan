import { useState } from 'react';
import { Download, Filter, Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useStudents } from '@/hooks/useStudents';
import { useMonthlyAttendances } from '@/hooks/useAttendances';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const Reports = () => {
  const now = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: attendances = [], isLoading: loadingAttendances } = useMonthlyAttendances(startDate, endDate);

  const uniqueClasses = [...new Set(students.map(s => s.class_name))].sort();

  const filteredAttendances = attendances.filter(a => {
    if (classFilter !== 'all' && a.student?.class_name !== classFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const handleExportExcel = () => {
    if (filteredAttendances.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const data = filteredAttendances.map((a, index) => ({
      'No': index + 1,
      'NISN': a.student?.nisn || '-',
      'Nama': a.student?.full_name || '-',
      'Kelas': a.student?.class_name || '-',
      'Tanggal': a.attendance_date,
      'Jam Datang': a.time_in,
      'Jam Pulang': a.time_out || '-',
      'Status': a.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');
    
    // Auto-size columns
    const colWidths = [
      { wch: 5 },  // No
      { wch: 15 }, // NISN
      { wch: 30 }, // Nama
      { wch: 15 }, // Kelas
      { wch: 12 }, // Tanggal
      { wch: 12 }, // Jam Datang
      { wch: 12 }, // Jam Pulang
      { wch: 10 }, // Status
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `rekap-absensi-${startDate}-to-${endDate}.xlsx`);
    toast.success('Data berhasil diekspor ke Excel!');
  };

  const handleExportPDF = () => {
    if (filteredAttendances.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Rekap Absensi Bulanan', 14, 15);
    
    // Period info
    doc.setFontSize(10);
    const formattedStart = format(parseISO(startDate), 'd MMMM yyyy', { locale: localeId });
    const formattedEnd = format(parseISO(endDate), 'd MMMM yyyy', { locale: localeId });
    doc.text(`Periode: ${formattedStart} - ${formattedEnd}`, 14, 22);
    doc.text(`Filter Kelas: ${classFilter === 'all' ? 'Semua Kelas' : classFilter}`, 14, 28);
    doc.text(`Total Data: ${filteredAttendances.length} record`, 14, 34);

    // Table
    const tableData = filteredAttendances.map((a, index) => [
      index + 1,
      a.student?.nisn || '-',
      a.student?.full_name || '-',
      a.student?.class_name || '-',
      a.attendance_date,
      a.time_in,
      a.time_out || '-',
      a.status
    ]);

    autoTable(doc, {
      head: [['No', 'NISN', 'Nama', 'Kelas', 'Tanggal', 'Datang', 'Pulang', 'Status']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`rekap-absensi-${startDate}-to-${endDate}.pdf`);
    toast.success('Data berhasil diekspor ke PDF!');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = { 
      Hadir: 'bg-success', 
      Izin: 'bg-info', 
      Sakit: 'bg-warning', 
      Alpha: 'bg-destructive' 
    };
    return <Badge className={`${variants[status] || ''} text-white`}>{status}</Badge>;
  };

  // Calculate summary stats
  const summary = {
    total: filteredAttendances.length,
    hadir: filteredAttendances.filter(a => a.status === 'Hadir').length,
    izin: filteredAttendances.filter(a => a.status === 'Izin').length,
    sakit: filteredAttendances.filter(a => a.status === 'Sakit').length,
    alpha: filteredAttendances.filter(a => a.status === 'Alpha').length,
    sudahPulang: filteredAttendances.filter(a => a.time_out).length,
  };

  if (loadingStudents || loadingAttendances) return <AdminLayout><Skeleton className="h-96" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Rekap Absensi Bulanan</h1>
            <p className="text-muted-foreground mt-1">Laporan data kehadiran siswa dengan filter tanggal</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filter Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Akhir</Label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
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

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-primary">{summary.total}</p>
              <p className="text-sm text-muted-foreground">Total Record</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-success">{summary.hadir}</p>
              <p className="text-sm text-muted-foreground">Hadir</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-info">{summary.izin}</p>
              <p className="text-sm text-muted-foreground">Izin</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-warning">{summary.sakit}</p>
              <p className="text-sm text-muted-foreground">Sakit</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-destructive">{summary.alpha}</p>
              <p className="text-sm text-muted-foreground">Alpha</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-orange-500">{summary.sudahPulang}</p>
              <p className="text-sm text-muted-foreground">Sudah Pulang</p>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Absensi ({filteredAttendances.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAttendances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Tidak ada data untuk periode ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>NISN</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Datang</TableHead>
                      <TableHead>Pulang</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendances.map((a, index) => (
                      <TableRow key={a.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{a.student?.nisn || '-'}</TableCell>
                        <TableCell className="font-medium">{a.student?.full_name || '-'}</TableCell>
                        <TableCell>{a.student?.class_name || '-'}</TableCell>
                        <TableCell>{a.attendance_date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {a.time_in}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {a.time_out ? (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                              {a.time_out}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(a.status)}</TableCell>
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

export default Reports;