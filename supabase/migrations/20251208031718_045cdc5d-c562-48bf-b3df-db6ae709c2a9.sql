-- Add late time setting to school_settings
ALTER TABLE public.school_settings
ADD COLUMN IF NOT EXISTS late_time time without time zone DEFAULT '07:30:00';

-- Add comment for clarity
COMMENT ON COLUMN public.school_settings.late_time IS 'Time after which students are considered late';