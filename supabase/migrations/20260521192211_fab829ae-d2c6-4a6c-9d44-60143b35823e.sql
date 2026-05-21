-- Allow admins full CRUD on investment_plans
CREATE POLICY "Admins can insert plans"
ON public.investment_plans
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update plans"
ON public.investment_plans
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete plans"
ON public.investment_plans
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Make plans readable by anon too (currently only authenticated) so landing/simulator can show them
CREATE POLICY "Plans readable by anon"
ON public.investment_plans
FOR SELECT
TO anon
USING (true);