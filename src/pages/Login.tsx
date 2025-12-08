import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import defaultLogo from '@/assets/school-logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSchoolSettings();
  
  const logoUrl = settings?.school_logo_url || defaultLogo;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error('Login gagal!', {
        description: error.message,
      });
    } else {
      toast.success('Login berhasil!');
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
            <img src={logoUrl} alt={settings?.school_name || "Logo Sekolah"} className="w-20 h-20 object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Sistem Absensi Siswa</CardTitle>
            <CardDescription className="text-base mt-2">
              {settings?.school_name || 'SMAN 1 Manonjaya'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <Alert className="mt-6 border-muted bg-muted/50">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="text-sm text-muted-foreground">
              Sistem ini menggunakan undangan. Hubungi administrator untuk mendapatkan akses.
            </AlertDescription>
          </Alert>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate('/register')}>
              Punya undangan? Daftar disini
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
