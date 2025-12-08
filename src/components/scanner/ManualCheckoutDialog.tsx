import { useState } from 'react';
import { Search, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useRecordAttendance } from '@/hooks/useAttendances';
import { toast } from 'sonner';

type Student = {
  id: string;
  full_name: string;
  class_name: string;
  nisn: string;
};

type AttendanceWithStudent = {
  id: string;
  time_in: string;
  time_out: string | null;
  students: Student;
};

const ManualCheckoutDialog = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AttendanceWithStudent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const recordAttendance = useRecordAttendance();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          id,
          time_in,
          time_out,
          students!inner (
            id,
            full_name,
            class_name,
            nisn
          )
        `)
        .eq('attendance_date', today)
        .is('time_out', null)
        .or(`full_name.ilike.%${searchQuery}%,nisn.ilike.%${searchQuery}%,class_name.ilike.%${searchQuery}%`, { foreignTable: 'students' });

      if (error) throw error;
      
      // Type assertion for the joined data
      const typedData = (data || []).map(item => ({
        id: item.id,
        time_in: item.time_in,
        time_out: item.time_out,
        students: item.students as unknown as Student
      }));
      
      setSearchResults(typedData);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Gagal mencari siswa');
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualCheckout = async (studentId: string, studentName: string) => {
    try {
      await recordAttendance.mutateAsync({ studentId, mode: 'check_out' });
      toast.success(`Checkout berhasil untuk ${studentName}`);
      setSearchResults(prev => prev.filter(r => r.students.id !== studentId));
    } catch (error: any) {
      if (error.message === 'ALREADY_CHECKED_OUT') {
        toast.warning('Siswa sudah checkout');
      } else {
        toast.error('Gagal checkout');
      }
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-14 gap-2">
          <User className="w-5 h-5" />
          Manual Checkout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Checkout Siswa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cari nama, NISN, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {searchResults.length === 0 && searchQuery && !isSearching && (
              <p className="text-center text-muted-foreground py-4">
                Tidak ada siswa yang belum checkout
              </p>
            )}
            
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">{result.students.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.students.class_name} • Masuk: {result.time_in.slice(0, 5)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => handleManualCheckout(result.students.id, result.students.full_name)}
                  disabled={recordAttendance.isPending}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Checkout
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualCheckoutDialog;
