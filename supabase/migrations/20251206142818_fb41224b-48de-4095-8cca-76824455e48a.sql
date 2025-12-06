-- Fix RLS policies for school_settings table
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can view school_settings" ON public.school_settings;
DROP POLICY IF EXISTS "Authenticated users can update school_settings" ON public.school_settings;

-- Create stricter policies that require authentication
CREATE POLICY "Authenticated users can view school_settings" 
ON public.school_settings 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update school_settings" 
ON public.school_settings 
FOR UPDATE 
TO authenticated
USING (true);

-- Fix RLS policies for students table
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

CREATE POLICY "Authenticated users can view students" 
ON public.students 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert students" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update students" 
ON public.students 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete students" 
ON public.students 
FOR DELETE 
TO authenticated
USING (true);

-- Fix RLS policies for attendances table  
DROP POLICY IF EXISTS "Authenticated users can view attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated users can insert attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated users can update attendances" ON public.attendances;
DROP POLICY IF EXISTS "Authenticated users can delete attendances" ON public.attendances;

CREATE POLICY "Authenticated users can view attendances" 
ON public.attendances 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert attendances" 
ON public.attendances 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendances" 
ON public.attendances 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete attendances" 
ON public.attendances 
FOR DELETE 
TO authenticated
USING (true);