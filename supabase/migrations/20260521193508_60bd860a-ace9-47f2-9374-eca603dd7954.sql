CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  -- Permetti sempre quando chiamata da contesti senza utente (trigger SECURITY DEFINER, service_role, cron)
  IF v_caller IS NULL THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
  END IF;

  -- Un utente autenticato può interrogare solo il proprio ruolo,
  -- a meno che non sia esso stesso admin (in tal caso può ispezionare chiunque).
  IF _user_id <> v_caller THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_caller AND role = 'admin'::public.app_role) THEN
      RETURN false;
    END IF;
  END IF;

  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
END;
$$;