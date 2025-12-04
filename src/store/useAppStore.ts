import { create } from 'zustand';
import { Student, Attendance } from '@/types';
import { mockStudents, mockAttendances, generateUniqueId } from '@/data/mockData';

interface AppState {
  students: Student[];
  attendances: Attendance[];
  isAuthenticated: boolean;
  currentUser: { name: string; role: 'admin' | 'petugas' } | null;
  
  // Auth actions
  login: (username: string, password: string) => boolean;
  logout: () => void;
  
  // Student actions
  addStudent: (student: Omit<Student, 'id' | 'student_unique_id' | 'created_at'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentByUniqueId: (uniqueId: string) => Student | undefined;
  
  // Attendance actions
  recordAttendance: (studentUniqueId: string) => { success: boolean; message: string; student?: Student };
  getTodayAttendances: () => Attendance[];
}

export const useAppStore = create<AppState>((set, get) => ({
  students: mockStudents,
  attendances: mockAttendances,
  isAuthenticated: false,
  currentUser: null,
  
  login: (username, password) => {
    // Simple auth for demo - in production use Lovable Cloud
    if (username === 'admin' && password === 'admin123') {
      set({ isAuthenticated: true, currentUser: { name: 'Administrator', role: 'admin' } });
      return true;
    }
    if (username === 'petugas' && password === 'petugas123') {
      set({ isAuthenticated: true, currentUser: { name: 'Petugas Piket', role: 'petugas' } });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ isAuthenticated: false, currentUser: null });
  },
  
  addStudent: (studentData) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now().toString(),
      student_unique_id: generateUniqueId(),
      created_at: new Date(),
    };
    set(state => ({ students: [...state.students, newStudent] }));
    return newStudent;
  },
  
  updateStudent: (id, updates) => {
    set(state => ({
      students: state.students.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  },
  
  deleteStudent: (id) => {
    set(state => ({
      students: state.students.filter(s => s.id !== id),
    }));
  },
  
  getStudentByUniqueId: (uniqueId) => {
    return get().students.find(s => s.student_unique_id === uniqueId);
  },
  
  recordAttendance: (studentUniqueId) => {
    const student = get().getStudentByUniqueId(studentUniqueId);
    
    if (!student) {
      return { success: false, message: 'QR CODE TIDAK VALID!' };
    }
    
    if (!student.is_active) {
      return { success: false, message: 'SISWA TIDAK AKTIF!' };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = get().attendances.find(
      a => a.student_id === student.id && a.attendance_date === today
    );
    
    if (existingAttendance) {
      return { success: false, message: 'SUDAH ABSEN HARI INI!', student };
    }
    
    const newAttendance: Attendance = {
      id: Date.now().toString(),
      student_id: student.id,
      attendance_date: today,
      time_in: new Date().toLocaleTimeString('id-ID', { hour12: false }),
      status: 'Hadir',
    };
    
    set(state => ({ attendances: [...state.attendances, newAttendance] }));
    
    return { success: true, message: 'ABSENSI BERHASIL!', student };
  },
  
  getTodayAttendances: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().attendances.filter(a => a.attendance_date === today);
  },
}));
