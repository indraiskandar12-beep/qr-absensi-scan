import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Volume2, VolumeX, LogIn, LogOut, Bluetooth, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useRecordAttendance, AttendanceMode } from '@/hooks/useAttendances';
import { cn } from '@/lib/utils';
import ManualCheckoutDialog from './ManualCheckoutDialog';
import ScanHistory from './ScanHistory';
import OfflineQueueIndicator from './OfflineQueueIndicator';
import { toast } from 'sonner';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { useQueryClient } from '@tanstack/react-query';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useStudentCache } from '@/hooks/useStudentCache';

type ScanResult = {
  type: 'success' | 'warning' | 'error';
  message: string;
  studentName?: string;
  studentClass?: string;
  timeInfo?: string;
} | null;

type ScannerMode = 'camera' | 'barcode';

// Default auto-switch time to check-out mode (can be configured)
const DEFAULT_AUTO_SWITCH_TIME = '12:00';

const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mode, setMode] = useState<AttendanceMode>('check_in');
  const [scannerMode, setScannerMode] = useState<ScannerMode>('camera');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>('');
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const recordAttendance = useRecordAttendance();
  const { data: schoolSettings } = useSchoolSettings();
  const queryClient = useQueryClient();
  const {
    queue,
    isOnline,
    isSyncing,
    addToQueue,
    removeFromQueue,
    syncQueue,
    clearQueue,
  } = useOfflineQueue();
  const {
    findStudentByUniqueId: findCachedStudent,
    syncStudentsToCache,
    getCacheStats,
    isLoading: isCacheSyncing,
  } = useStudentCache();

  const playSound = useCallback((type: 'success' | 'warning' | 'error', attendanceMode: AttendanceMode = 'check_in') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
      if (attendanceMode === 'check_in') {
        // Check-in: Bright ascending tone (cheerful welcome)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } else {
        // Check-out: Descending double beep (goodbye signal)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.01, audioContext.currentTime + 0.18);
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 0.22);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    } else if (type === 'warning') {
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } else {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [soundEnabled]);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    let student = null;
    
    // If offline, try to find from cache first
    if (!isOnline) {
      student = findCachedStudent(decodedText);
      
      if (!student) {
        playSound('error');
        setScanResult({
          type: 'error',
          message: 'DATA SISWA TIDAK TERSEDIA OFFLINE!',
        });
        setTimeout(() => setScanResult(null), 3000);
        return;
      }
    } else {
      // Online: fetch from server
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_unique_id', decodedText)
        .maybeSingle();
      
      if (error || !data) {
        playSound('error');
        setScanResult({
          type: 'error',
          message: 'QR CODE TIDAK VALID!',
        });
        setTimeout(() => setScanResult(null), 3000);
        return;
      }
      
      student = data;
    }

    if (!student.is_active) {
      playSound('error');
      setScanResult({
        type: 'error',
        message: 'SISWA TIDAK AKTIF!',
      });
      setTimeout(() => setScanResult(null), 3000);
      return;
    }

    const currentTime = new Date().toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // If offline, add to queue instead of sending to server
    if (!isOnline) {
      addToQueue(student.id, student.full_name, student.class_name, mode);
      playSound('success', mode);
      setScanResult({
        type: 'success',
        message: mode === 'check_in' ? 'DISIMPAN OFFLINE (DATANG)' : 'DISIMPAN OFFLINE (PULANG)',
        studentName: student.full_name,
        studentClass: student.class_name,
        timeInfo: `${currentTime} (offline)`,
      });
      setTimeout(() => setScanResult(null), 3000);
      return;
    }

    try {
      await recordAttendance.mutateAsync({ studentId: student.id, mode });
      playSound('success', mode);
      setScanResult({
        type: 'success',
        message: mode === 'check_in' ? 'ABSENSI DATANG BERHASIL!' : 'ABSENSI PULANG BERHASIL!',
        studentName: student.full_name,
        studentClass: student.class_name,
        timeInfo: currentTime,
      });
      // Refresh scan history
      queryClient.invalidateQueries({ queryKey: ['recent-scans'] });
    } catch (error: any) {
      if (error.message === 'ALREADY_CHECKED_IN') {
        playSound('warning');
        setScanResult({
          type: 'warning',
          message: 'SUDAH ABSEN DATANG!',
          studentName: student.full_name,
          studentClass: student.class_name,
        });
      } else if (error.message === 'NOT_CHECKED_IN') {
        playSound('warning');
        setScanResult({
          type: 'warning',
          message: 'BELUM ABSEN DATANG!',
          studentName: student.full_name,
          studentClass: student.class_name,
        });
      } else if (error.message === 'ALREADY_CHECKED_OUT') {
        playSound('warning');
        setScanResult({
          type: 'warning',
          message: 'SUDAH ABSEN PULANG!',
          studentName: student.full_name,
          studentClass: student.class_name,
        });
      } else {
        // Network error or other error - add to offline queue
        console.error('Attendance error:', error);
        addToQueue(student.id, student.full_name, student.class_name, mode);
        playSound('success', mode);
        setScanResult({
          type: 'success',
          message: 'DISIMPAN OFFLINE - AKAN DISINKRONKAN',
          studentName: student.full_name,
          studentClass: student.class_name,
          timeInfo: `${currentTime} (pending)`,
        });
      }
    }

    setTimeout(() => setScanResult(null), 3000);
  }, [recordAttendance, playSound, mode, isOnline, addToQueue, queryClient, findCachedStudent]);

  // Handle barcode scanner input from input field
  const handleBarcodeKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim() && !isProcessing) {
      e.preventDefault();
      setIsProcessing(true);
      await handleScanSuccess(barcodeInput.trim());
      setBarcodeInput('');
      setIsProcessing(false);
      // Refocus input for next scan
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [barcodeInput, handleScanSuccess, isProcessing]);

  // Global keyboard listener for barcode scanner (HID device)
  useEffect(() => {
    if (scannerMode !== 'barcode') return;

    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      // Ignore if typing in other inputs or if already processing
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' && target !== barcodeInputRef.current;
      if (isInputField || isProcessing) return;

      // Clear existing timeout
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }

      if (e.key === 'Enter') {
        // Process the buffered barcode
        const barcode = barcodeBufferRef.current.trim();
        if (barcode && !isProcessing) {
          setIsProcessing(true);
          setBarcodeInput(barcode);
          await handleScanSuccess(barcode);
          setBarcodeInput('');
          setIsProcessing(false);
        }
        barcodeBufferRef.current = '';
        return;
      }

      // Append printable characters to buffer
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBufferRef.current += e.key;
        setBarcodeInput(barcodeBufferRef.current);
        
        // Auto-clear buffer after 100ms of inactivity (typical scanner sends data fast)
        barcodeTimeoutRef.current = setTimeout(() => {
          barcodeBufferRef.current = '';
          setBarcodeInput('');
        }, 500);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [scannerMode, handleScanSuccess, isProcessing]);

  // Auto-focus barcode input when switching to barcode mode
  useEffect(() => {
    if (scannerMode === 'barcode') {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
      toast.info('Mode Barcode Scanner aktif. Scanner Bluetooth siap digunakan!');
    }
  }, [scannerMode]);

  // Auto-switch to check-out mode after specified time
  useEffect(() => {
    if (!autoSwitchEnabled) return;

    const checkAutoSwitch = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const switchTime = schoolSettings?.late_time?.slice(0, 5) || DEFAULT_AUTO_SWITCH_TIME;
      
      // If current time >= switch time, auto-switch to check-out
      if (currentTime >= switchTime && mode === 'check_in') {
        setMode('check_out');
        toast.info(`Mode otomatis berubah ke Pulang (setelah jam ${switchTime})`);
      }
    };

    // Check on mount and every minute
    checkAutoSwitch();
    const interval = setInterval(checkAutoSwitch, 60000);
    
    return () => clearInterval(interval);
  }, [autoSwitchEnabled, schoolSettings?.late_time, mode]);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        () => {} // Ignore errors during scanning
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4">
      {/* Scanner Container */}
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg overflow-hidden">
        <div className={cn(
          "p-4 transition-colors",
          mode === 'check_in' ? "bg-primary" : "bg-warning"
        )}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-primary-foreground">Scanner Absensi</h2>
            <OfflineQueueIndicator
              queue={queue}
              isOnline={isOnline}
              isSyncing={isSyncing}
              onSync={syncQueue}
              onClear={clearQueue}
              onRemove={removeFromQueue}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-primary-foreground/80 text-sm">
              Mode: {mode === 'check_in' ? 'Absensi Datang' : 'Absensi Pulang'}
              {scannerMode === 'barcode' && ' • Barcode Scanner'}
              {!isOnline && ' • Offline'}
            </p>
            {/* Cache sync button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => syncStudentsToCache().then(success => {
                if (success) {
                  const stats = getCacheStats();
                  toast.success(`${stats.count} data siswa tersimpan untuk offline`);
                }
              })}
              disabled={!isOnline || isCacheSyncing}
              title="Sync data siswa untuk offline"
            >
              <RefreshCw className={cn("w-3 h-3 mr-1", isCacheSyncing && "animate-spin")} />
              {isCacheSyncing ? 'Syncing...' : `Cache: ${getCacheStats().count}`}
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          {/* Scanner Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={scannerMode === 'camera' ? 'default' : 'outline'}
              className={cn(
                "flex-1",
                scannerMode === 'camera' && "bg-secondary text-secondary-foreground"
              )}
              onClick={() => {
                if (isScanning) stopScanner();
                setScannerMode('camera');
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              Kamera
            </Button>
            <Button
              variant={scannerMode === 'barcode' ? 'default' : 'outline'}
              className={cn(
                "flex-1",
                scannerMode === 'barcode' && "bg-info text-info-foreground"
              )}
              onClick={() => {
                if (isScanning) stopScanner();
                setScannerMode('barcode');
              }}
            >
              <Bluetooth className="w-4 h-4 mr-2" />
              Barcode
            </Button>
          </div>

          {/* Attendance Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === 'check_in' ? 'default' : 'outline'}
              className={cn(
                "flex-1 h-12",
                mode === 'check_in' && "bg-primary hover:bg-primary/90"
              )}
              onClick={() => {
                setMode('check_in');
                setAutoSwitchEnabled(false);
              }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Datang
            </Button>
            <Button
              variant={mode === 'check_out' ? 'default' : 'outline'}
              className={cn(
                "flex-1 h-12",
                mode === 'check_out' && "bg-warning hover:bg-warning/90 text-warning-foreground"
              )}
              onClick={() => {
                setMode('check_out');
                setAutoSwitchEnabled(false);
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Pulang
            </Button>
          </div>

          {/* Auto-switch indicator */}
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              Auto-switch ke Pulang: {schoolSettings?.late_time?.slice(0, 5) || DEFAULT_AUTO_SWITCH_TIME}
              {autoSwitchEnabled ? ' (aktif)' : ' (nonaktif)'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setAutoSwitchEnabled(!autoSwitchEnabled)}
            >
              {autoSwitchEnabled ? 'Matikan' : 'Aktifkan'}
            </Button>
          </div>

          {/* Camera Scanner */}
          {scannerMode === 'camera' && (
            <>
              <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
                <div id="qr-reader" className="w-full h-full" />
                
                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                    <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center px-4">
                      Tekan tombol di bawah untuk memulai scanner kamera
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                {!isScanning ? (
                  <Button 
                    onClick={startScanner} 
                    className={cn(
                      "flex-1 h-14 text-lg",
                      mode === 'check_out' && "bg-warning hover:bg-warning/90 text-warning-foreground"
                    )}
                    size="lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Mulai Scan
                  </Button>
                ) : (
                  <Button 
                    onClick={stopScanner} 
                    variant="destructive"
                    className="flex-1 h-14 text-lg"
                    size="lg"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Berhenti
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </div>
            </>
          )}

          {/* Barcode Scanner Mode */}
          {scannerMode === 'barcode' && (
            <div className="space-y-4">
              <div className={cn(
                "aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
                isProcessing ? "border-warning bg-warning/10" : "border-info bg-info/10"
              )}>
                <Bluetooth className={cn(
                  "w-16 h-16 mb-4",
                  isProcessing ? "text-warning animate-pulse" : "text-info"
                )} />
                <p className="text-center px-4 font-medium">
                  {isProcessing ? 'Memproses...' : 'Barcode Scanner Siap'}
                </p>
                <p className="text-muted-foreground text-sm text-center px-4 mt-2">
                  Arahkan barcode scanner ke kartu siswa
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Scan atau ketik ID siswa..."
                  className={cn(
                    "h-14 text-lg text-center font-mono",
                    mode === 'check_in' ? "focus-visible:ring-primary" : "focus-visible:ring-warning"
                  )}
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  Scanner akan otomatis memproses saat Enter ditekan
                </p>
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full h-12"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5 mr-2" /> : <VolumeX className="w-5 h-5 mr-2" />}
                {soundEnabled ? 'Suara Aktif' : 'Suara Mati'}
              </Button>
            </div>
          )}
          
          {/* Manual Checkout Button */}
          <div className="mt-4">
            <ManualCheckoutDialog />
        </div>

        {/* Scan History */}
        <ScanHistory />
      </div>
      </div>

      {/* Scan Result Overlay */}
      {scanResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={cn(
            "w-full max-w-sm p-8 rounded-2xl text-center animate-bounce-in",
            scanResult.type === 'success' && "bg-success",
            scanResult.type === 'warning' && "bg-warning",
            scanResult.type === 'error' && "bg-destructive"
          )}>
            <div className="text-6xl mb-4">
              {scanResult.type === 'success' && '✅'}
              {scanResult.type === 'warning' && '⚠️'}
              {scanResult.type === 'error' && '❌'}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {scanResult.message}
            </h3>
            {scanResult.studentName && (
              <div className="mt-4 text-white">
                <p className="text-xl font-semibold">{scanResult.studentName}</p>
                <p className="text-lg opacity-90">{scanResult.studentClass}</p>
                {scanResult.timeInfo && (
                  <p className="text-lg mt-2 font-mono bg-white/20 rounded-lg py-1 px-3 inline-block">
                    {scanResult.timeInfo}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
