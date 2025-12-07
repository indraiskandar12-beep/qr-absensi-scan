import { z } from 'zod';

// Student validation schema
export const studentSchema = z.object({
  nisn: z.string()
    .trim()
    .min(1, 'NISN wajib diisi')
    .max(20, 'NISN maksimal 20 karakter')
    .regex(/^[0-9]+$/, 'NISN hanya boleh berisi angka'),
  full_name: z.string()
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  class_name: z.string()
    .trim()
    .min(1, 'Kelas wajib diisi')
    .max(50, 'Kelas maksimal 50 karakter'),
  major: z.string()
    .trim()
    .min(1, 'Jurusan wajib diisi')
    .max(100, 'Jurusan maksimal 100 karakter'),
});

export type StudentFormData = z.infer<typeof studentSchema>;

// Staff invitation validation schema
export const staffInvitationSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid')
    .max(255, 'Email maksimal 255 karakter'),
  full_name: z.string()
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  role: z.enum(['admin', 'petugas'], {
    errorMap: () => ({ message: 'Role harus admin atau petugas' }),
  }),
});

export type StaffInvitationFormData = z.infer<typeof staffInvitationSchema>;

// School settings validation schema
export const schoolSettingsSchema = z.object({
  school_name: z.string()
    .trim()
    .min(1, 'Nama sekolah wajib diisi')
    .max(200, 'Nama sekolah maksimal 200 karakter'),
  school_address: z.string()
    .trim()
    .max(500, 'Alamat maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
  school_phone: z.string()
    .trim()
    .max(20, 'Telepon maksimal 20 karakter')
    .regex(/^[0-9()\-\s+]*$/, 'Format telepon tidak valid')
    .optional()
    .or(z.literal('')),
  school_email: z.string()
    .trim()
    .email('Format email tidak valid')
    .max(255, 'Email maksimal 255 karakter')
    .optional()
    .or(z.literal('')),
  school_logo_url: z.string()
    .trim()
    .url('Format URL tidak valid')
    .max(500, 'URL maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
});

export type SchoolSettingsFormData = z.infer<typeof schoolSettingsSchema>;

// Profile validation schema
export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Password change validation schema
export const passwordChangeSchema = z.object({
  newPassword: z.string()
    .min(6, 'Password minimal 6 karakter')
    .max(72, 'Password maksimal 72 karakter'),
  confirmPassword: z.string()
    .min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// Helper function to validate form data - returns null on success, error message on failure
export function getValidationError<T>(schema: z.ZodSchema<T>, data: unknown): string | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return null;
  }
  return result.error.errors[0]?.message || 'Validasi gagal';
}
