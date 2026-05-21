-- task_templates: admin CRUD
CREATE POLICY "Admins can insert tasks"
ON public.task_templates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tasks"
ON public.task_templates FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tasks"
ON public.task_templates FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- notifications: admin update + delete
CREATE POLICY "Admins can update notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- popup_notifications: admin delete
CREATE POLICY "Admins can delete popups"
ON public.popup_notifications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));