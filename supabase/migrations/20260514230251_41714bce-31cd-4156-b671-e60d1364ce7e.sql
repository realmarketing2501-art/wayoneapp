
-- Tabella eventi signup/login
CREATE TABLE public.signup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  provider text NOT NULL DEFAULT 'email',
  google_sub text,
  event_type text NOT NULL DEFAULT 'signup', -- signup | login
  ip text,
  user_agent text,
  os text,
  device_type text,
  screen text,
  language text,
  timezone text,
  fingerprint_hash text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_signup_events_user ON public.signup_events(user_id);
CREATE INDEX idx_signup_events_ip ON public.signup_events(ip);
CREATE INDEX idx_signup_events_fp ON public.signup_events(fingerprint_hash);
CREATE INDEX idx_signup_events_google ON public.signup_events(google_sub);
CREATE INDEX idx_signup_events_created ON public.signup_events(created_at DESC);

ALTER TABLE public.signup_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view signup events" ON public.signup_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabella anomalie
CREATE TABLE public.account_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  match_user_id uuid,
  type text NOT NULL, -- duplicate_ip | duplicate_fingerprint | duplicate_google_sub | duplicate_wallet
  severity text NOT NULL DEFAULT 'medium', -- low | medium | high
  details jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_anomalies_user ON public.account_anomalies(user_id);
CREATE INDEX idx_anomalies_match ON public.account_anomalies(match_user_id);
CREATE INDEX idx_anomalies_resolved ON public.account_anomalies(resolved, created_at DESC);

ALTER TABLE public.account_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view anomalies" ON public.account_anomalies
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update anomalies" ON public.account_anomalies
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RPC: registra evento + scansiona duplicati
CREATE OR REPLACE FUNCTION public.record_signup_event(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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

  INSERT INTO public.signup_events (
    user_id, email, provider, google_sub, event_type,
    ip, user_agent, os, device_type, screen, language, timezone, fingerprint_hash, raw
  ) VALUES (
    v_user_id, v_email, v_provider, v_google_sub, v_event_type,
    v_ip, v_ua, v_os, v_device, v_screen, v_lang, v_tz, v_fp, p_payload
  ) RETURNING id INTO v_event_id;

  -- Solo per signup: cerca duplicati
  IF v_event_type = 'signup' THEN

    -- IP match
    IF v_ip IS NOT NULL THEN
      FOR r IN
        SELECT DISTINCT user_id FROM public.signup_events
        WHERE ip = v_ip AND user_id <> v_user_id
          AND created_at > now() - v_window
        LIMIT 5
      LOOP
        INSERT INTO public.account_anomalies (user_id, match_user_id, type, severity, details)
        VALUES (v_user_id, r.user_id, 'duplicate_ip', 'medium',
          jsonb_build_object('ip', v_ip));
      END LOOP;
    END IF;

    -- Fingerprint match
    IF v_fp IS NOT NULL THEN
      FOR r IN
        SELECT DISTINCT user_id FROM public.signup_events
        WHERE fingerprint_hash = v_fp AND user_id <> v_user_id
          AND created_at > now() - v_window
        LIMIT 5
      LOOP
        INSERT INTO public.account_anomalies (user_id, match_user_id, type, severity, details)
        VALUES (v_user_id, r.user_id, 'duplicate_fingerprint', 'high',
          jsonb_build_object('fingerprint_hash', v_fp, 'os', v_os, 'device_type', v_device));
      END LOOP;
    END IF;

    -- Google sub match
    IF v_google_sub IS NOT NULL THEN
      FOR r IN
        SELECT DISTINCT user_id FROM public.signup_events
        WHERE google_sub = v_google_sub AND user_id <> v_user_id
        LIMIT 5
      LOOP
        INSERT INTO public.account_anomalies (user_id, match_user_id, type, severity, details)
        VALUES (v_user_id, r.user_id, 'duplicate_google_sub', 'high',
          jsonb_build_object('google_sub', v_google_sub));
      END LOOP;
    END IF;

  END IF;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_signup_event(jsonb) TO anon, authenticated, service_role;
