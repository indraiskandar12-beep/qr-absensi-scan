-- Create school_settings table
CREATE TABLE public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name VARCHAR NOT NULL DEFAULT 'Nama Sekolah',
  school_address TEXT,
  school_logo_url TEXT,
  school_phone VARCHAR,
  school_email VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to view
CREATE POLICY "Authenticated users can view school_settings"
ON public.school_settings
FOR SELECT
TO authenticated
USING (true);

-- Only allow update for authenticated users
CREATE POLICY "Authenticated users can update school_settings"
ON public.school_settings
FOR UPDATE
TO authenticated
USING (true);

-- Insert default settings
INSERT INTO public.school_settings (school_name, school_address)
VALUES ('SMK Negeri 1', 'Jl. Pendidikan No. 1');

-- Trigger for updated_at
CREATE TRIGGER update_school_settings_updated_at
BEFORE UPDATE ON public.school_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();