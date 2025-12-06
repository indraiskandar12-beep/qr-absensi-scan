export interface Student {
  id: string;
  student_unique_id: string;
  nisn: string;
  full_name: string;
  class_name: string;
  major: string;
  qr_code_path?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  attendance_date: string;
  time_in: string;
  time_out?: string | null;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
  created_at: string;
  student?: Student;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'petugas';
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'petugas';
  created_at: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'petugas';
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}
