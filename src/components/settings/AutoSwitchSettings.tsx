import { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSchoolSettings, useUpdateSchoolSettings } from '@/hooks/useSchoolSettings';
import { toast } from 'sonner';

interface AutoSwitchSettingsProps {
  lateTime: string;
  onLateTimeChange: (time: string) => void;
}

const AutoSwitchSettings = ({ lateTime, onLateTimeChange }: AutoSwitchSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Pengaturan Auto-Switch Scanner
        </CardTitle>
        <CardDescription>
          Atur waktu otomatis untuk berganti mode absensi datang ke pulang
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="auto_switch_time">Jam Auto-Switch ke Mode Pulang</Label>
          <Input
            id="auto_switch_time"
            type="time"
            value={lateTime}
            onChange={(e) => onLateTimeChange(e.target.value)}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Setelah jam ini, scanner akan otomatis berganti ke mode Absensi Pulang. Waktu ini juga digunakan sebagai batas jam masuk untuk menentukan siswa terlambat.
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Cara Kerja Auto-Switch:</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Saat scanner dibuka sebelum jam ini, mode default adalah <strong>Absensi Datang</strong></li>
            <li>Setelah jam ini terlewati, mode otomatis berubah ke <strong>Absensi Pulang</strong></li>
            <li>Anda tetap bisa mengubah mode secara manual kapan saja</li>
            <li>Mode manual akan menonaktifkan auto-switch hingga halaman di-refresh</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoSwitchSettings;
