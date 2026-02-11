import AdminLayout from '@/components/layout/AdminLayout';
import { useStudentCache } from '@/hooks/useStudentCache';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { RefreshCw, Trash2, Database, Wifi, WifiOff, Clock, Users, HardDrive, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const OfflineManager = () => {
  const { 
    getCachedStudents, syncStudentsToCache, clearCache, 
    isLoading: isCacheLoading, lastSync, getCacheStats 
  } = useStudentCache();
  const { queue, isOnline, isSyncing, syncQueue, clearQueue } = useOfflineQueue();

  const cacheStats = getCacheStats();
  const cachedStudents = getCachedStudents();

  const handleSyncStudents = async () => {
    const success = await syncStudentsToCache();
    if (success) toast.success('Cache siswa berhasil diperbarui!');
    else toast.error('Gagal memperbarui cache. Pastikan koneksi internet aktif.');
  };

  const handleClearCache = () => {
    clearCache();
    toast.success('Cache siswa berhasil dihapus');
  };

  const handleSyncQueue = async () => {
    if (queue.length === 0) {
      toast.info('Tidak ada antrian scan untuk disinkronkan');
      return;
    }
    await syncQueue();
  };

  const handleClearQueue = () => {
    clearQueue();
    toast.success('Antrian scan berhasil dihapus');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengelolaan Data Offline</h1>
          <p className="text-muted-foreground mt-1">Kelola cache data siswa dan antrian scan offline</p>
        </div>

        {/* Status Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <><Wifi className="w-5 h-5 text-green-500" /><span className="text-sm font-medium text-green-600">Online</span></>
                ) : (
                  <><WifiOff className="w-5 h-5 text-destructive" /><span className="text-sm font-medium text-destructive">Offline</span></>
                )}
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="w-4 h-4" />
                <span>{cacheStats.count} siswa di cache</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="w-4 h-4" />
                <span>{queue.length} scan menunggu sync</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Cache Siswa */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Cache Data Siswa</CardTitle>
                  <CardDescription className="mt-1">Data siswa disimpan lokal untuk akses offline</CardDescription>
                </div>
                <Badge variant={cacheStats.isStale ? 'destructive' : 'secondary'}>
                  {cacheStats.isStale ? 'Kadaluarsa' : 'Aktif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{cacheStats.count}</p>
                  <p className="text-xs text-muted-foreground">Siswa tersimpan</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {cacheStats.lastSync ? format(cacheStats.lastSync, 'dd MMM yyyy HH:mm', { locale: id }) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Terakhir sync</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSyncStudents} disabled={isCacheLoading || !isOnline} className="flex-1">
                  <RefreshCw className={`w-4 h-4 ${isCacheLoading ? 'animate-spin' : ''}`} />
                  {isCacheLoading ? 'Memperbarui...' : 'Sync Sekarang'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" disabled={cacheStats.count === 0}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Cache Siswa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Semua data siswa yang tersimpan lokal akan dihapus. Scanner tidak bisa digunakan offline sampai cache disinkronkan ulang.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearCache}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Antrian Offline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><HardDrive className="w-5 h-5" /> Antrian Scan Offline</CardTitle>
                  <CardDescription className="mt-1">Scan yang belum disinkronkan ke server</CardDescription>
                </div>
                <Badge variant={queue.length > 0 ? 'default' : 'secondary'}>
                  {queue.length} antrian
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{queue.length}</p>
                  <p className="text-xs text-muted-foreground">Menunggu sync</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {queue.filter(s => s.mode === 'check_in').length} / {queue.filter(s => s.mode === 'check_out').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Masuk / Keluar</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSyncQueue} disabled={isSyncing || !isOnline || queue.length === 0} className="flex-1">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Menyinkronkan...' : 'Sync Sekarang'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" disabled={queue.length === 0}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Antrian Scan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Semua data scan yang belum disinkronkan akan hilang secara permanen. Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearQueue}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daftar Antrian */}
        {queue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Detail Antrian Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium">{scan.studentName}</TableCell>
                      <TableCell>{scan.studentClass}</TableCell>
                      <TableCell>
                        <Badge variant={scan.mode === 'check_in' ? 'default' : 'secondary'}>
                          {scan.mode === 'check_in' ? 'Masuk' : 'Keluar'}
                        </Badge>
                      </TableCell>
                      <TableCell>{scan.localDate}</TableCell>
                      <TableCell>{scan.localTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Daftar Cache Siswa */}
        {cachedStudents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Data Siswa Tersimpan ({cachedStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>NISN</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Jurusan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cachedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell>{student.nisn}</TableCell>
                        <TableCell>{student.class_name}</TableCell>
                        <TableCell>{student.major}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default OfflineManager;
