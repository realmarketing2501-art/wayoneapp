-- Scope detected transaction admin policies to authenticated admins only
DROP POLICY IF EXISTS "Admins can view all detected transactions" ON public.detected_transactions;
DROP POLICY IF EXISTS "Admins can update detected transactions" ON public.detected_transactions;

CREATE POLICY "Admins can view all detected transactions"
ON public.detected_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update detected transactions"
ON public.detected_transactions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Remove direct user write access to task progress/rewards
DROP POLICY IF EXISTS "Users can upsert own tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Admins can insert user tasks" ON public.user_tasks;
DROP POLICY IF EXISTS "Admins can update user tasks" ON public.user_tasks;

CREATE POLICY "Admins can insert user tasks"
ON public.user_tasks
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update user tasks"
ON public.user_tasks
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Ensure database-level protection is actually attached to the table
CREATE OR REPLACE FUNCTION public.protect_user_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Progressi attività gestiti dal sistema';
END;
$function$;

DROP TRIGGER IF EXISTS protect_user_tasks_insert_update ON public.user_tasks;
CREATE TRIGGER protect_user_tasks_insert_update
BEFORE INSERT OR UPDATE ON public.user_tasks
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_tasks();