-- Fix RLS policy for user_quotas to allow admin upsert
-- This allows super_admin to manage quotas for any user

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins podem gerenciar quotas de todos" ON user_quotas;
DROP POLICY IF EXISTS "Super admins can manage all user quotas" ON user_quotas;

-- Create new comprehensive policy for admins
CREATE POLICY "Super admins can manage all user quotas"
ON user_quotas
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- Also ensure users can read their own quota
DROP POLICY IF EXISTS "Users can view their own quota" ON user_quotas;

CREATE POLICY "Users can view their own quota"
ON user_quotas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
