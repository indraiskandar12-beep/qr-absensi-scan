import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

type ScanResult = {
  type: 'success' | 'warning' | 'error';
  message: string;
  studentName?: string;
  studentClass?: string;
} | null;

const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { recordAttendance } = useAppStore();

  const playSound = useCallback((type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
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

  const handleScanSuccess = useCallback((decodedText: string) => {
    const result = recordAttendance(decodedText);
    
    if (result.success) {
      playSound('success');
      setScanResult({
        type: 'success',
        message: result.message,
        studentName: result.student?.full_name,
        studentClass: result.student?.class_name,
      });
    } else if (result.student) {
      playSound('warning');
      setScanResult({
        type: 'warning',
        message: result.message,
        studentName: result.student.full_name,
        studentClass: result.student.class_name,
      });
    } else {
      playSound('error');
      setScanResult({
        type: 'error',
        message: result.message,
      });
    }

    // Clear result after 3 seconds
    setTimeout(() => setScanResult(null), 3000);
  }, [recordAttendance, playSound]);

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
        <div className="bg-primary p-4 text-center">
          <h2 className="text-xl font-bold text-primary-foreground">Scanner Absensi</h2>
          <p className="text-primary-foreground/80 text-sm">Arahkan kamera ke QR Code siswa</p>
        </div>
        
        <div className="p-4">
          {/* QR Reader Container */}
          <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
            <div id="qr-reader" className="w-full h-full" />
            
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                <Camera className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center px-4">
                  Tekan tombol di bawah untuk memulai scanner
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mt-4">
            {!isScanning ? (
              <Button 
                onClick={startScanner} 
                className="flex-1 h-14 text-lg"
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
