CREATE OR REPLACE FUNCTION public.admin_set_user_suspended(p_user_id uuid, p_suspended boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'user_id richiesto'; END IF;

  UPDATE public.profiles
  SET is_suspended = COALESCE(p_suspended, false),
      updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profilo non trovato';
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_suspended(uuid, boolean) TO authenticated;