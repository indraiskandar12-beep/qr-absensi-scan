import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Install Aplikasi Absensi</CardTitle>
          <CardDescription>
            Dapatkan akses cepat dan gunakan aplikasi secara offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status indicators */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-yellow-500" />
                  <span className="text-muted-foreground">Offline</span>
                </>
              )}
            </div>
          </div>

          {isInstalled ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aplikasi Terinstall!</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Aplikasi sudah terinstall di perangkat Anda
              </p>
              <Link to="/login">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Cara Install di iOS:</h4>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                    <span>Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                    <span>Scroll ke bawah dan ketuk <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                    <span>Ketuk <strong>"Add"</strong> di pojok kanan atas</span>
                  </li>
                </ol>
              </div>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Keuntungan Install:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Akses langsung dari home screen</li>
                  <li>✓ Bisa digunakan offline</li>
                  <li>✓ Loading lebih cepat</li>
                  <li>✓ Tampilan layar penuh</li>
                </ul>
              </div>
              <Button onClick={handleInstall} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Install Sekarang
              </Button>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  Nanti Saja
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Buka halaman ini di browser Chrome atau Safari untuk menginstall aplikasi
                </p>
              </div>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
