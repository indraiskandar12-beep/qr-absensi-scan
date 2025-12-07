import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useStaffInvitations } from '@/hooks/useStaffInvitations';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Trash2, Mail, Clock, Shield, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';
import { staffInvitationSchema, getValidationError } from '@/lib/validations';
import { toast } from 'sonner';

const StaffManagement = () => {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { invitations, isLoading, createInvitation, deleteInvitation } = useStaffInvitations();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'petugas'>('petugas');

  // Redirect non-admins
  if (!roleLoading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = { email, full_name: fullName, role };
    const error = getValidationError(staffInvitationSchema, formData);
    if (error) {
      toast.error(error);
      return;
    }
    
    await createInvitation.mutateAsync(formData);

    setEmail('');
    setFullName('');
    setRole('petugas');
    setDialogOpen(false);
  };

  const handleDeleteInvitation = async (id: string) => {
    await deleteInvitation.mutateAsync(id);
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kelola Staff</h1>
            <p className="text-muted-foreground">
              Undang staff baru untuk mengakses sistem absensi
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Undang Staff Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Undang Staff Baru</DialogTitle>
                <DialogDescription>
                  Buat undangan untuk staff baru. Mereka akan menerima link untuk mendaftar via email yang didaftarkan.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateInvitation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    placeholder="Masukkan nama lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value: 'admin' | 'petugas') => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petugas">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Petugas
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Admin dapat mengelola staff dan pengaturan sekolah. Petugas hanya dapat mengelola data siswa dan absensi.
                  </p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={createInvitation.isPending}>
                    {createInvitation.isPending ? 'Membuat...' : 'Buat Undangan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Undangan Pending</CardTitle>
            <CardDescription>
              Daftar undangan yang belum digunakan. Undangan berlaku selama 7 hari.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Memuat...</p>
            ) : invitations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Belum ada undangan pending
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Kadaluarsa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {invitation.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>
                          {invitation.role === 'admin' ? (
                            <ShieldCheck className="w-3 h-3 mr-1" />
                          ) : (
                            <Shield className="w-3 h-3 mr-1" />
                          )}
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {format(new Date(invitation.expires_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isExpired(invitation.expires_at) ? (
                          <Badge variant="destructive">Kadaluarsa</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                            Aktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Undangan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Undangan untuk {invitation.full_name} ({invitation.email}) akan dihapus dan tidak dapat digunakan lagi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteInvitation(invitation.id)}
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cara Kerja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                1
              </div>
              <p>Admin membuat undangan dengan email dan role yang ditentukan</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                2
              </div>
              <p>Beritahu staff baru untuk mendaftar menggunakan email yang sama</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                3
              </div>
              <p>Staff mendaftar via halaman login, sistem akan otomatis memberikan akses sesuai role</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                4
              </div>
              <p>Undangan berlaku 7 hari. Setelah kadaluarsa, buat undangan baru</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default StaffManagement;
