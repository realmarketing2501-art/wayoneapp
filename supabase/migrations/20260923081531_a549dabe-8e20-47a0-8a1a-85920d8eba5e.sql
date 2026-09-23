-- investment_plans
DROP POLICY IF EXISTS "Plans readable by anon" ON public.investment_plans;
DROP POLICY IF EXISTS "Plans viewable by all authenticated" ON public.investment_plans;
CREATE POLICY "Active plans readable by anon" ON public.investment_plans
  FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "Active plans readable by authenticated" ON public.investment_plans
  FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Admins can view all plans" ON public.investment_plans
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- levels
DROP POLICY IF EXISTS "Levels readable by anon" ON public.levels;
DROP POLICY IF EXISTS "Levels readable by all authenticated" ON public.levels;
CREATE POLICY "Active levels readable by anon" ON public.levels
  FOR SELECT TO anon USING (active = true);
CREATE POLICY "Active levels readable by authenticated" ON public.levels
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins can view all levels" ON public.levels
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- special_funds
DROP POLICY IF EXISTS "Funds viewable by authenticated" ON public.special_funds;
CREATE POLICY "Published funds viewable by authenticated" ON public.special_funds
  FOR SELECT TO authenticated USING (status <> 'draft');
CREATE POLICY "Admins can view all funds" ON public.special_funds
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- task_templates
DROP POLICY IF EXISTS "Tasks viewable by authenticated" ON public.task_templates;
CREATE POLICY "Active tasks viewable by authenticated" ON public.task_templates
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins can view all tasks" ON public.task_templates
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- notifications
DROP POLICY IF EXISTS "Notifications viewable by authenticated" ON public.notifications;
CREATE POLICY "Users view own or broadcast notifications" ON public.notifications
  FOR SELECT TO authenticated USING (
    COALESCE(target_audience, 'all') = 'all'
    OR EXISTS (
      SELECT 1 FROM public.user_notifications un
      WHERE un.notification_id = notifications.id AND un.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- popup_notifications
DROP POLICY IF EXISTS "Popups viewable by authenticated" ON public.popup_notifications;
CREATE POLICY "Active popups viewable by authenticated" ON public.popup_notifications
  FOR SELECT TO authenticated USING (
    COALESCE(is_active, false) = true
    AND (expires_at IS NULL OR expires_at > now())
  );
CREATE POLICY "Admins can view all popups" ON public.popup_notifications
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));