-- Fix 1: Update profiles UPDATE policy to prevent role modification
DROP POLICY IF EXISTS "Users can update own profile name only" ON public.profiles;

CREATE POLICY "Users can update own profile name only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Fix 2: Update storage policies to restrict write access to admins only
-- First, drop the existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- Create new admin-only policies for write operations
CREATE POLICY "Admins can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'school-logos' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'school-logos' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'school-logos' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);