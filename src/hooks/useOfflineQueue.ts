import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AttendanceMode } from './useAttendances';

export interface QueuedScan {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  mode: AttendanceMode;
  timestamp: string;
  localDate: string;
  localTime: string;
}

const QUEUE_STORAGE_KEY = 'offline_scan_queue';

// Helper function to get local date in YYYY-MM-DD format
const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get local time in HH:MM:SS format
const getLocalTimeString = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedScan[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (stored) {
      try {
        setQueue(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse offline queue:', e);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Koneksi kembali! Menyinkronkan data...', {
        id: 'connection-restored',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Mode Offline - Scan akan disimpan dan disinkronkan saat koneksi kembali', {
        id: 'connection-lost',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add scan to queue
  const addToQueue = useCallback((
    studentId: string, 
    studentName: string, 
    studentClass: string,
    mode: AttendanceMode
  ): QueuedScan => {
    const newScan: QueuedScan = {
      id: crypto.randomUUID(),
      studentId,
      studentName,
      studentClass,
      mode,
      timestamp: new Date().toISOString(),
      localDate: getLocalDateString(),
      localTime: getLocalTimeString(),
    };

    setQueue(prev => [...prev, newScan]);
    return newScan;
  }, []);

  // Remove scan from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(scan => scan.id !== id));
  }, []);

  // Process single queued scan
  const processScan = async (scan: QueuedScan): Promise<boolean> => {
    try {
      if (scan.mode === 'check_in') {
        // Check if already checked in for that date
        const { data: existing } = await supabase
          .from('attendances')
          .select('id')
          .eq('student_id', scan.studentId)
          .eq('attendance_date', scan.localDate)
          .maybeSingle();

        if (existing) {
          // Already checked in, skip this record
          return true;
        }

        const { error } = await supabase
          .from('attendances')
          .insert({
            student_id: scan.studentId,
            attendance_date: scan.localDate,
            time_in: scan.localTime,
            status: 'Hadir',
          });

        if (error) throw error;
      } else {
        // Check out mode
        const { data: existing } = await supabase
          .from('attendances')
          .select('id, time_out')
          .eq('student_id', scan.studentId)
          .eq('attendance_date', scan.localDate)
          .maybeSingle();

        if (!existing) {
          // No check-in record, create one with check-out time
          const { error } = await supabase
            .from('attendances')
            .insert({
              student_id: scan.studentId,
              attendance_date: scan.localDate,
              time_in: scan.localTime,
              time_out: scan.localTime,
              status: 'Hadir',
            });
          if (error) throw error;
        } else if (!existing.time_out) {
          // Update existing record with check-out time
          const { error } = await supabase
            .from('attendances')
            .update({ time_out: scan.localTime })
            .eq('id', existing.id);
          if (error) throw error;
        }
        // If already checked out, just skip
      }
      return true;
    } catch (error) {
      console.error('Failed to sync scan:', error);
      return false;
    }
  };

  // Sync all queued scans
  const syncQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    let successCount = 0;
    let failedScans: QueuedScan[] = [];

    for (const scan of queue) {
      const success = await processScan(scan);
      if (success) {
        successCount++;
      } else {
        failedScans.push(scan);
      }
    }

    // Update queue with only failed scans
    setQueue(failedScans);
    setIsSyncing(false);

    if (successCount > 0) {
      toast.success(`${successCount} scan berhasil disinkronkan!`, {
        id: 'sync-success',
      });
    }

    if (failedScans.length > 0) {
      toast.error(`${failedScans.length} scan gagal disinkronkan. Akan dicoba lagi nanti.`, {
        id: 'sync-failed',
      });
    }

    return { successCount, failedCount: failedScans.length };
  }, [isOnline, queue, isSyncing]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      // Delay sync slightly to ensure connection is stable
      const timeout = setTimeout(() => {
        syncQueue();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, queue.length, isSyncing, syncQueue]);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }, []);

  return {
    queue,
    isOnline,
    isSyncing,
    queueLength: queue.length,
    addToQueue,
    removeFromQueue,
    syncQueue,
    clearQueue,
  };
};
