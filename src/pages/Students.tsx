import { useState } from 'react';
import { Plus, Search, Edit, Trash2, QrCode, Printer, Upload } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useStudents, useAddStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import QRCode from 'qrcode';
import { Student } from '@/types';
import { generateStudentCards } from '@/utils/generateStudentCard';
import ImportStudentsDialog from '@/components/students/ImportStudentsDialog';
import { studentSchema, getValidationError } from '@/lib/validations';
import { toast } from 'sonner';

const Students = () => {
  const { data: students = [], isLoading } = useStudents();
  const { data: schoolSettings } = useSchoolSettings();
  const addStudent = useAddStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [formData, setFormData] = useState({ nisn: '', full_name: '', class_name: '', major: '' });
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nisn.includes(searchQuery) ||
    s.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateQRCodeUrl = async (uniqueId: string) => {
    try {
      return await QRCode.toDataURL(uniqueId, { width: 300, margin: 2 });
    } catch { return ''; }
  };

  const handleAddStudent = async () => {
    const error = getValidationError(studentSchema, formData);
    if (error) {
      toast.error(error);
      return;
    }
    await addStudent.mutateAsync({ ...formData, is_active: true, qr_code_path: null });
    setDialogOpen(false);
    setFormData({ nisn: '', full_name: '', class_name: '', major: '' });
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;
    const error = getValidationError(studentSchema, formData);
    if (error) {
      toast.error(error);
      return;
    }
    await updateStudent.mutateAsync({ id: selectedStudent.id, ...formData });
    setDialogOpen(false);
  };

  const handleShowQR = async (student: Student) => {
    const qrUrl = await generateQRCodeUrl(student.student_unique_id);
    setQrCodeUrl(qrUrl);
    setSelectedStudent(student);
    setQrDialogOpen(true);
  };

  const handlePrintCards = async () => {
    const studentsToPrint = selectedIds.size > 0 
      ? filteredStudents.filter(s => selectedIds.has(s.id))
      : filteredStudents;
    
    if (studentsToPrint.length === 0) {
      toast.error('Pilih minimal 1 siswa untuk dicetak');
      return;
    }
    
    setIsPrinting(true);
    try {
      await generateStudentCards(studentsToPrint, schoolSettings);
      toast.success(`Berhasil mencetak ${studentsToPrint.length} kartu siswa`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));
  const isSomeSelected = filteredStudents.some(s => selectedIds.has(s.id));

  if (isLoading) return <AdminLayout><Skeleton className="h-96" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Data Siswa</h1>
            <p className="text-muted-foreground mt-1">Kelola data siswa dan generate QR Code</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />Import
            </Button>
            <Button variant="outline" onClick={handlePrintCards} disabled={filteredStudents.length === 0 || isPrinting}>
              <Printer className="w-4 h-4 mr-2" />
              {isPrinting ? 'Memproses...' : selectedIds.size > 0 ? `Cetak ${selectedIds.size} Kartu` : 'Cetak Semua'}
            </Button>
            <Button onClick={() => { setSelectedStudent(null); setFormData({ nisn: '', full_name: '', class_name: '', major: '' }); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Tambah Siswa
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Siswa ({filteredStudents.length})</CardTitle>
              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {selectedIds.size} dipilih
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Pilih semua"
                      className={isSomeSelected && !isAllSelected ? 'opacity-50' : ''}
                    />
                  </TableHead>
                  <TableHead>No</TableHead><TableHead>NISN</TableHead><TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead><TableHead>Jurusan</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow key={student.id} className={selectedIds.has(student.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(student.id)}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                        aria-label={`Pilih ${student.full_name}`}
                      />
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{student.nisn}</TableCell>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.class_name}</TableCell>
                    <TableCell>{student.major}</TableCell>
                    <TableCell><Badge variant={student.is_active ? 'default' : 'secondary'}>{student.is_active ? 'Aktif' : 'Nonaktif'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleShowQR(student)}><QrCode className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setFormData({ nisn: student.nisn, full_name: student.full_name, class_name: student.class_name, major: student.major }); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteStudent.mutate(student.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedStudent ? 'Edit Siswa' : 'Tambah Siswa'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>NISN</Label><Input value={formData.nisn} onChange={(e) => setFormData({...formData, nisn: e.target.value})} /></div>
              <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Kelas</Label><Input value={formData.class_name} onChange={(e) => setFormData({...formData, class_name: e.target.value})} /></div>
              <div className="space-y-2"><Label>Jurusan</Label><Input value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button onClick={selectedStudent ? handleUpdateStudent : handleAddStudent}>{selectedStudent ? 'Simpan' : 'Tambah'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>QR Code Siswa</DialogTitle></DialogHeader>
            {selectedStudent && (
              <div className="flex flex-col items-center py-6">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 rounded-lg shadow-lg" />}
                <p className="font-semibold text-lg mt-4">{selectedStudent.full_name}</p>
                <p className="text-muted-foreground">{selectedStudent.class_name}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">ID: {selectedStudent.student_unique_id}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <ImportStudentsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      </div>
    </AdminLayout>
  );
};

export default Students;
