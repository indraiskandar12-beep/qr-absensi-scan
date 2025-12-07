-- Fix staff_invitations RLS: Only the admin who created the invitation can view/delete it
-- This prevents other admins from seeing invitations they didn't create

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view invitations" ON public.staff_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.staff_invitations;

-- Create new stricter policies - only creator can see their invitations
CREATE POLICY "Admins can view own invitations" 
ON public.staff_invitations 
FOR SELECT 
USING (auth.uid() = invited_by);

-- Admins can only delete invitations they created
CREATE POLICY "Admins can delete own invitations" 
ON public.staff_invitations 
FOR DELETE 
USING (auth.uid() = invited_by);