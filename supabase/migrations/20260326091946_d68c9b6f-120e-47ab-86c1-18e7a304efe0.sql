
-- Allow admin to manage notifications
CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admin to manage popup notifications
CREATE POLICY "Admins can insert popups" ON public.popup_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update popups" ON public.popup_notifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to update admin_settings
CREATE POLICY "Admins can update settings" ON public.admin_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to view all deposits
CREATE POLICY "Admins can view all deposits" ON public.deposits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to update deposits (confirm)
CREATE POLICY "Admins can update deposits" ON public.deposits
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to update withdrawals (approve/reject)
CREATE POLICY "Admins can update withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to view all withdrawals
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to insert income records (for manual adjustments)
CREATE POLICY "Admins can insert income" ON public.income_records
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
