-- Add missing RLS policies for super_admin administrative operations

-- profiles: Allow super_admin to delete profiles
CREATE POLICY "Super admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- profiles: Allow super_admin to update profiles (for transfers)
CREATE POLICY "Super admins can update profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- companies: Allow super_admin to delete companies
CREATE POLICY "Super admins can delete companies"
ON public.companies
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- subscriptions: Allow super_admin to delete subscriptions
CREATE POLICY "Super admins can delete subscriptions"
ON public.subscriptions
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- user_roles: Allow super_admin to update roles
CREATE POLICY "Super admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- leads: Allow super_admin to delete leads from any company
CREATE POLICY "Super admins can delete all leads"
ON public.leads
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- search_history: Allow super_admin to delete search history from any company
CREATE POLICY "Super admins can delete all search history"
ON public.search_history
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- company_settings: Allow super_admin to delete company settings
CREATE POLICY "Super admins can delete company settings"
ON public.company_settings
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));