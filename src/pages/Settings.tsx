import { useState, useEffect } from 'react';
import { Save, Building2, User } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useSchoolSettings, useUpdateSchoolSettings } from '@/hooks/useSchoolSettings';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { schoolSettingsSchema, profileSchema, passwordChangeSchema, getValidationError } from '@/lib/validations';

const Settings = () => {
  const { data: settings, isLoading } = useSchoolSettings();
  const updateSettings = useUpdateSchoolSettings();
  const { profile, user } = useAuth();
  
  const [schoolForm, setSchoolForm] = useState({
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    school_logo_url: '',
  });
  
  const [profileForm, setProfileForm] = useState({
    full_name: '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (settings) {
      setSchoolForm({
        school_name: settings.school_name || '',
        school_address: settings.school_address || '',
        school_phone: settings.school_phone || '',
        school_email: settings.school_email || '',
        school_logo_url: settings.school_logo_url || '',
      });
    }
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
      });
    }
  }, [profile]);

  const handleSaveSchool = async () => {
    const error = getValidationError(schoolSettingsSchema, schoolForm);
    if (error) {
      toast.error(error);
      return;
    }
    await updateSettings.mutateAsync(schoolForm);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    const error = getValidationError(profileSchema, profileForm);
    if (error) {
      toast.error(error);
      return;
    }
    
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ full_name: profileForm.full_name })
      .eq('id', user.id);
    
    if (dbError) {
      toast.error('Gagal menyimpan profil: ' + dbError.message);
    } else {
      toast.success('Profil berhasil disimpan!');
    }
  };

  const handleChangePassword = async () => {
    const error = getValidationError(passwordChangeSchema, passwordForm);
    if (error) {
      toast.error(error);
      return;
    }
    
    const { error: authError } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });
    
    if (authError) {
      toast.error('Gagal mengubah password: ' + authError.message);
    } else {
      toast.success('Password berhasil diubah!');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground mt-1">Kelola pengaturan sekolah dan profil Anda</p>
        </div>

        <Tabs defaultValue="school" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="school" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Sekolah
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="school" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Sekolah</CardTitle>
                <CardDescription>
                  Pengaturan ini akan digunakan pada kartu siswa dan laporan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="school_name">Nama Sekolah</Label>
                    <Input
                      id="school_name"
                      value={schoolForm.school_name}
                      onChange={(e) => setSchoolForm({ ...schoolForm, school_name: e.target.value })}
                      placeholder="Masukkan nama sekolah"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school_email">Email Sekolah</Label>
                    <Input
                      id="school_email"
                      type="email"
                      value={schoolForm.school_email}
                      onChange={(e) => setSchoolForm({ ...schoolForm, school_email: e.target.value })}
                      placeholder="email@sekolah.sch.id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school_phone">Telepon</Label>
                    <Input
                      id="school_phone"
                      value={schoolForm.school_phone}
                      onChange={(e) => setSchoolForm({ ...schoolForm, school_phone: e.target.value })}
                      placeholder="(021) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school_logo_url">URL Logo Sekolah</Label>
                    <Input
                      id="school_logo_url"
                      value={schoolForm.school_logo_url}
                      onChange={(e) => setSchoolForm({ ...schoolForm, school_logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school_address">Alamat Sekolah</Label>
                  <Textarea
                    id="school_address"
                    value={schoolForm.school_address}
                    onChange={(e) => setSchoolForm({ ...schoolForm, school_address: e.target.value })}
                    placeholder="Jl. Pendidikan No. 1, Kota"
                    rows={3}
                  />
                </div>
                {schoolForm.school_logo_url && (
                  <div className="space-y-2">
                    <Label>Preview Logo</Label>
                    <div className="w-24 h-24 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <img 
                        src={schoolForm.school_logo_url} 
                        alt="Logo sekolah" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                <Button onClick={handleSaveSchool} disabled={updateSettings.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {updateSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>
                  Kelola informasi profil akun Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Nama lengkap Anda"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={profile?.role || ''} disabled />
                </div>
                <Button onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Profil
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ubah Password</CardTitle>
                <CardDescription>
                  Ganti password akun Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Ulangi password baru"
                  />
                </div>
                <Button onClick={handleChangePassword} variant="secondary">
                  Ubah Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
