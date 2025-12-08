import { useState, useEffect, useRef } from 'react';
import { Save, Building2, User, Upload, X } from 'lucide-react';
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
import schoolLogoDefault from '@/assets/school-logo.png';

const Settings = () => {
  const { data: settings, isLoading, refetch } = useSchoolSettings();
  const updateSettings = useUpdateSchoolSettings();
  const { profile, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const [uploading, setUploading] = useState(false);

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

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `school-logo-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('school-logos')
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;

      // Update school settings with new logo URL
      await updateSettings.mutateAsync({
        ...schoolForm,
        school_logo_url: logoUrl,
      });

      setSchoolForm(prev => ({ ...prev, school_logo_url: logoUrl }));
      toast.success('Logo berhasil diupload!');
      refetch();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Gagal mengupload logo: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateSettings.mutateAsync({
        ...schoolForm,
        school_logo_url: '',
      });
      setSchoolForm(prev => ({ ...prev, school_logo_url: '' }));
      toast.success('Logo berhasil dihapus');
      refetch();
    } catch (error: any) {
      toast.error('Gagal menghapus logo: ' + error.message);
    }
  };

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
              <CardContent className="space-y-6">
                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <Label>Logo Sekolah</Label>
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <img 
                        src={schoolForm.school_logo_url || schoolLogoDefault} 
                        alt="Logo sekolah" 
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = schoolLogoDefault;
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadLogo}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Mengupload...' : 'Upload Logo Baru'}
                      </Button>
                      {schoolForm.school_logo_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Hapus Logo
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Format: JPG, PNG, GIF. Maksimal 2MB.
                      </p>
                    </div>
                  </div>
                </div>

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