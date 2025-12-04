import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, QrCode, Eye } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { Student } from '@/types';

const Students = () => {
  const { students, addStudent, updateStudent, deleteStudent } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [formData, setFormData] = useState({
    nisn: '',
    full_name: '',
    class_name: '',
    major: '',
  });

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nisn.includes(searchQuery) ||
    s.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateQRCode = async (uniqueId: string) => {
    try {
      const url = await QRCode.toDataURL(uniqueId, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      return url;
    } catch (err) {
      console.error('Error generating QR code:', err);
      return '';
    }
  };

  const handleAddStudent = async () => {
    if (!formData.nisn || !formData.full_name || !formData.class_name || !formData.major) {
      toast.error('Semua field harus diisi!');
      return;
    }

    const newStudent = addStudent({
      ...formData,
      is_active: true,
    });

    toast.success('Siswa berhasil ditambahkan!', {
      description: `${newStudent.full_name} - ${newStudent.student_unique_id}`,
    });

    setDialogOpen(false);
    resetForm();
  };

  const handleUpdateStudent = () => {
    if (!selectedStudent) return;

    updateStudent(selectedStudent.id, formData);
    toast.success('Data siswa berhasil diperbarui!');
    setDialogOpen(false);
    resetForm();
  };

  const handleDeleteStudent = (student: Student) => {
    if (confirm(`Hapus siswa ${student.full_name}?`)) {
      deleteStudent(student.id);
      toast.success('Siswa berhasil dihapus!');
    }
  };

  const handleShowQR = async (student: Student) => {
    const qrUrl = await generateQRCode(student.student_unique_id);
    setQrCodeUrl(qrUrl);
    setSelectedStudent(student);
    setQrDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      nisn: student.nisn,
      full_name: student.full_name,
      class_name: student.class_name,
      major: student.major,
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedStudent(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ nisn: '', full_name: '', class_name: '', major: '' });
    setSelectedStudent(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Data Siswa</h1>
            <p className="text-muted-foreground mt-1">
              Kelola data siswa dan generate QR Code
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Siswa
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, NISN, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Daftar Siswa ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>NISN</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{student.nisn}</TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.class_name}</TableCell>
                      <TableCell>{student.major}</TableCell>
                      <TableCell>
                        <Badge variant={student.is_active ? 'default' : 'secondary'}>
                          {student.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleShowQR(student)}
                            title="Lihat QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(student)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteStudent(student)}
                            className="text-destructive hover:text-destructive"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
              </DialogTitle>
              <DialogDescription>
                {selectedStudent 
                  ? 'Perbarui data siswa di bawah ini'
                  : 'Isi form untuk menambahkan siswa baru'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nisn">NISN</Label>
                <Input
                  id="nisn"
                  placeholder="Masukkan NISN"
                  value={formData.nisn}
                  onChange={(e) => setFormData({...formData, nisn: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  placeholder="Masukkan nama lengkap"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class_name">Kelas</Label>
                <Input
                  id="class_name"
                  placeholder="Contoh: X RPL 1"
                  value={formData.class_name}
                  onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Jurusan</Label>
                <Input
                  id="major"
                  placeholder="Contoh: Rekayasa Perangkat Lunak"
                  value={formData.major}
                  onChange={(e) => setFormData({...formData, major: e.target.value})}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={selectedStudent ? handleUpdateStudent : handleAddStudent}>
                {selectedStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code Siswa</DialogTitle>
              <DialogDescription>
                Scan QR Code ini untuk absensi
              </DialogDescription>
            </DialogHeader>
            
            {selectedStudent && (
              <div className="flex flex-col items-center py-6">
                {qrCodeUrl && (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-64 h-64 rounded-lg shadow-lg"
                  />
                )}
                <div className="text-center mt-4">
                  <p className="font-semibold text-lg">{selectedStudent.full_name}</p>
                  <p className="text-muted-foreground">{selectedStudent.class_name}</p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    ID: {selectedStudent.student_unique_id}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
                Tutup
              </Button>
              <Button onClick={() => {
                const link = document.createElement('a');
                link.download = `qr-${selectedStudent?.nisn}.png`;
                link.href = qrCodeUrl;
                link.click();
              }}>
                Download QR
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Students;
