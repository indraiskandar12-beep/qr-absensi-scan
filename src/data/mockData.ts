import { Student, Attendance, DashboardStats } from '@/types';

// Mock data for demonstration - in production, this would connect to Lovable Cloud
const generateUniqueId = () => {
  return 'STU' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const mockStudents: Student[] = [
  {
    id: '1',
    student_unique_id: 'STU001ABC',
    nisn: '0012345678',
    full_name: 'Ahmad Rizki Pratama',
    class_name: 'X RPL 1',
    major: 'Rekayasa Perangkat Lunak',
    is_active: true,
    created_at: new Date(),
  },
  {
    id: '2',
    student_unique_id: 'STU002DEF',
    nisn: '0012345679',
    full_name: 'Siti Nurhaliza',
    class_name: 'X RPL 1',
    major: 'Rekayasa Perangkat Lunak',
    is_active: true,
    created_at: new Date(),
  },
  {
    id: '3',
    student_unique_id: 'STU003GHI',
    nisn: '0012345680',
    full_name: 'Budi Santoso',
    class_name: 'XI TKJ 2',
    major: 'Teknik Komputer Jaringan',
    is_active: true,
    created_at: new Date(),
  },
  {
    id: '4',
    student_unique_id: 'STU004JKL',
    nisn: '0012345681',
    full_name: 'Dewi Lestari',
    class_name: 'XII MM 1',
    major: 'Multimedia',
    is_active: true,
    created_at: new Date(),
  },
];

export const mockAttendances: Attendance[] = [
  {
    id: '1',
    student_id: '1',
    attendance_date: new Date().toISOString().split('T')[0],
    time_in: '07:15:00',
    status: 'Hadir',
  },
  {
    id: '2',
    student_id: '2',
    attendance_date: new Date().toISOString().split('T')[0],
    time_in: '07:30:00',
    status: 'Hadir',
  },
];

export const getDashboardStats = (): DashboardStats => {
  const today = new Date().toISOString().split('T')[0];
  const todayAttendances = mockAttendances.filter(a => a.attendance_date === today);
  
  return {
    totalStudents: mockStudents.filter(s => s.is_active).length,
    presentToday: todayAttendances.filter(a => a.status === 'Hadir').length,
    absentToday: mockStudents.length - todayAttendances.length,
    lateToday: 0,
  };
};

export { generateUniqueId };
