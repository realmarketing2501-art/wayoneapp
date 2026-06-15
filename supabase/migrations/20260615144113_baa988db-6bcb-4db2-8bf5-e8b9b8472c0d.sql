
-- 1) Profiles UPDATE: add WITH CHECK (trigger protect_profile_sensitive_fields enforces column-level)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) Admin SELECT su investments e fund_investments
CREATE POLICY "Admins can view all investments" ON public.investments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view all fund_investments" ON public.fund_investments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Utente può leggere i propri signup_events
CREATE POLICY "Users can view own signup events" ON public.signup_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4) record_signup_event: forza user_id = auth.uid() per chiamate autenticate
CREATE OR REPLACE FUNCTION public.record_signup_event(p_payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_user_id uuid := (p_payload->>'user_id')::uuid;
  v_email text := p_payload->>'email';
  v_provider text := COALESCE(p_payload->>'provider', 'email');
  v_google_sub text := p_payload->>'google_sub';
  v_event_type text := COALESCE(p_payload->>'event_type', 'signup');
  v_ip text := p_payload->>'ip';
  v_ua text := p_payload->>'user_agent';
  v_os text := p_payload->>'os';
  v_device text := p_payload->>'device_type';
  v_screen text := p_payload->>'screen';
  v_lang text := p_payload->>'language';
  v_tz text := p_payload->>'timezone';
  v_fp text := p_payload->>'fingerprint_hash';
  v_event_id uuid;
  v_window interval := interval '90 days';
  r record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required';
  END IF;

  -- Se chiamata da utente autenticato, il user_id deve coincidere
  IF v_caller IS NOT NULL AND v_caller <> v_user_id THEN
    RAISE EXCEPTION 'Access denied: user_id mismatch';
  END IF;

  INSERT INTO public.signup_events (
    user_id, email, provider, google_sub, event_type,
    ip, user_agent, os, device_type, screen, language, timezone, fingerprint_hash, raw
  ) VALUES (
    v_user_id, v_email, v_provider, v_google_sub, v_event_type,
    v_ip, v_ua, v_os, v_device, v_screen, v_lang, v_tz, v_fp, p_payload
  ) RETURNING id INTO v_event_id;

  IF v_event_type = 'signup' THEN
    IF v_ip IS NOT NULL THEN
      FOR r IN SELECT DISTINCT user_id FROM public.signup_events
        WHERE ip = v_ip AND user_id <> v_user_id AND created_at > now() - v_window LIMIT 5
      LOOP
        INSERT INTO public.account_anomalies (user_id, match_user_id, type, severity, details)
        VALUES (v_user_id, r.user_id, 'duplicate_ip', 'medium', jsonb_build_object('ip', v_ip));
      END LOOP;
    END IF;
    IF v_fp IS NOT NULL THEN
      FOR r IN SELECT DISTINCT user_id FROM public.signup_events
        WHERE fingerprint_hash = v_fp AND user_id <> v_user_id AND created_at > now() - v_window LIMIT 5
      LOOP
        INSERT INTO public.account_anomalies (user_id, match_user_id, type, severity, details)
        VALUES (v_user_id, r.user_id, 'duplicate_fingerprint', 'high',
          jsonb_build_object('fingerprint_hash', v_fp, 'os', v_os, 'device_type', v_device));
      END LOOP;
    END IF;
    IF v_google_sub IS NOT NULL THEN
      FOR r IN SELECT DISTINCT user_id FROM public.signup_events
        WHERE google_sub = v_google_sub AND user_id <> v_user_id LIMIT 5
      LOOP
        INSERT INTO public.account_anomalies (user_id, match_user_id, type, severity, details)
        VALUES (v_user_id, r.user_id, 'duplicate_google_sub', 'high', jsonb_build_object('google_sub', v_google_sub));
      END LOOP;
    END IF;
  END IF;

  RETURN v_event_id;
END;
$function$;
