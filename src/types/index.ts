export interface Student {
  id: string;
  student_unique_id: string;
  nisn: string;
  full_name: string;
  class_name: string;
  major: string;
  qr_code_path?: string;
  is_active: boolean;
  created_at: Date;
}

export interface Attendance {
  id: string;
  student_id: string;
  student?: Student;
  attendance_date: string;
  time_in: string;
  time_out?: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}
