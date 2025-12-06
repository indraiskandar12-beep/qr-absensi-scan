-- Create app_role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'petugas');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any valid role
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create invitations table for pending staff invitations
CREATE TABLE public.staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role app_role NOT NULL DEFAULT 'petugas',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamp with time zone
);

-- Enable RLS on invitations
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can view invitations"
ON public.staff_invitations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations"
ON public.staff_invitations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invitations"
ON public.staff_invitations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update existing RLS policies for students table to use role checking
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

CREATE POLICY "Staff can view students"
ON public.students
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can delete students"
ON public.students
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update existing RLS policies for attendances table
DROP POLICY IF EXISTS "Authenticated users can view attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated users can insert attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated users can update attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated users can delete attendances" ON public.attendances;

CREATE POLICY "Staff can view attendances"
ON public.attendances
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can insert attendances"
ON public.attendances
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can update attendances"
ON public.attendances
FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can delete attendances"
ON public.attendances
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update school_settings policies
DROP POLICY IF EXISTS "Authenticated users can view school_settings" ON public.school_settings;
DROP POLICY IF EXISTS "Authenticated users can update school_settings" ON public.school_settings;

CREATE POLICY "Staff can view school_settings"
ON public.school_settings
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can update school_settings"
ON public.school_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles policies to prevent role manipulation
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile name only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create trigger to assign role when user registers with valid invitation
CREATE OR REPLACE FUNCTION public.handle_new_user_with_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record staff_invitations%ROWTYPE;
BEGIN
  -- Check if there's a valid invitation for this email
  SELECT * INTO invitation_record
  FROM public.staff_invitations
  WHERE email = NEW.email
    AND used_at IS NULL
    AND expires_at > now();
  
  IF FOUND THEN
    -- Create profile
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      NEW.id,
      invitation_record.full_name,
      invitation_record.role::text
    );
    
    -- Assign role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invitation_record.role);
    
    -- Mark invitation as used
    UPDATE public.staff_invitations
    SET used_at = now()
    WHERE id = invitation_record.id;
  ELSE
    -- No valid invitation - create profile without role (user won't have access)
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      'petugas'
    );
    -- Note: No role assigned, user won't have access to any data
  END IF;
  
  RETURN NEW;
END;
$$;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_invitation();