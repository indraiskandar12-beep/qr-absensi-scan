-- Fix 1: Drop duplicate storage policies that allow any authenticated user access
DROP POLICY IF EXISTS "Authenticated users can upload school logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update school logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete school logos" ON storage.objects;

-- Fix 2: Add policy for admins to view all user profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));