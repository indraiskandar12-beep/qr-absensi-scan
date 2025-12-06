import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Users, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StaffInvitation } from '@/types';

const Register = () => {
  const [searchParams] = useSearchParams();
  const invitationEmail = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(invitationEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingInvitation, setCheckingInvitation] = useState(true);
  const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkInvitation = async () => {
      if (!email) {
        setCheckingInvitation(false);
        return;
      }

      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('email', email)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error checking invitation:', error);
      }

      setInvitation(data as StaffInvitation | null);
      setCheckingInvitation(false);
    };

    const debounce = setTimeout(checkInvitation, 500);
    return () => clearTimeout(debounce);
  }, [email]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (!invitation) {
      setError('Email tidak terdaftar dalam undangan. Hubungi administrator.');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, invitation.full_name);
    
    if (error) {
      toast.error('Pendaftaran gagal!', {
        description: error.message,
      });
    } else {
      toast.success('Pendaftaran berhasil!', {
        description: 'Silakan login dengan akun Anda',
      });
      navigate('/login');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Users className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Daftar Akun</CardTitle>
            <CardDescription className="text-base mt-2">
              Sistem Absensi - SMP Rekayasa Teknologi
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email undangan"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
              
              {!checkingInvitation && email && (
                <div className="mt-2">
                  {invitation ? (
                    <Alert className="border-green-500/20 bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600">
                        Undangan ditemukan untuk <strong>{invitation.full_name}</strong> ({invitation.role})
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Email tidak terdaftar dalam undangan atau sudah kadaluarsa
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {invitation && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      value={invitation.full_name}
                      className="pl-10 h-11 bg-muted"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nama sudah ditentukan oleh administrator
                  </p>
                </div>
            
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Buat password (min 6 karakter)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Ulangi password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium"
                  disabled={loading || !invitation}
                >
                  {loading ? 'Memproses...' : 'Daftar'}
                </Button>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate('/login')}>
              Sudah punya akun? Masuk
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
