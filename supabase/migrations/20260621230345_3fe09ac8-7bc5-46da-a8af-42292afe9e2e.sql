
-- 1) Admin: lista utenti con email e referrer (username + email)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  email text,
  referral_code text,
  level text,
  balance numeric,
  balance_available numeric,
  balance_locked numeric,
  is_suspended boolean,
  has_confirmed_deposit boolean,
  direct_referrals integer,
  units integer,
  production numeric,
  created_at timestamptz,
  referred_by uuid,
  referred_by_username text,
  referred_by_email text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.user_id, p.username,
    u.email::text AS email,
    p.referral_code, p.level::text,
    p.balance, p.balance_available, p.balance_locked,
    p.is_suspended, p.has_confirmed_deposit,
    p.direct_referrals, p.units, p.production,
    p.created_at,
    p.referred_by,
    rp.username AS referred_by_username,
    ru.email::text AS referred_by_email
  FROM public.profiles p
  LEFT JOIN auth.users u  ON u.id = p.user_id
  LEFT JOIN public.profiles rp ON rp.id = p.referred_by
  LEFT JOIN auth.users ru ON ru.id = rp.user_id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- 2) Estendi get_referral_tree con username + email del referrer
DROP FUNCTION IF EXISTS public.get_referral_tree(integer);

CREATE OR REPLACE FUNCTION public.get_referral_tree(max_depth integer DEFAULT 6)
RETURNS TABLE(
  id uuid, user_id uuid, username text, level text,
  has_confirmed_deposit boolean, created_at timestamptz,
  direct_referrals integer, referred_by uuid, depth integer,
  referred_by_username text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_profile uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  SELECT p.id INTO v_my_profile FROM public.profiles p WHERE p.user_id = auth.uid();
  IF v_my_profile IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH RECURSIVE downline AS (
    SELECT p.id, p.user_id, p.username, p.level::text AS level, p.has_confirmed_deposit,
           p.created_at, p.direct_referrals, p.referred_by, 1 AS depth
    FROM public.profiles p
    WHERE p.referred_by = v_my_profile
    UNION ALL
    SELECT p.id, p.user_id, p.username, p.level::text, p.has_confirmed_deposit,
           p.created_at, p.direct_referrals, p.referred_by, d.depth + 1
    FROM public.profiles p
    JOIN downline d ON p.referred_by = d.id
    WHERE d.depth < max_depth
  )
  SELECT d.id, d.user_id, d.username, d.level, d.has_confirmed_deposit,
         d.created_at, d.direct_referrals, d.referred_by, d.depth,
         pr.username AS referred_by_username
  FROM downline d
  LEFT JOIN public.profiles pr ON pr.id = d.referred_by;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_tree(integer) TO authenticated;

-- 3) Allega un codice referral DOPO il signup (utile per OAuth/Google senza ref nel form)
CREATE OR REPLACE FUNCTION public.attach_referral_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_my_profile_id uuid;
  v_current_ref uuid;
  v_referrer_profile uuid;
  v_referrer_user uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN RETURN false; END IF;

  SELECT id, referred_by INTO v_my_profile_id, v_current_ref
  FROM public.profiles WHERE user_id = v_uid;
  IF v_my_profile_id IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  -- Già associato: non sovrascrivere
  IF v_current_ref IS NOT NULL THEN RETURN false; END IF;

  SELECT id, user_id INTO v_referrer_profile, v_referrer_user
  FROM public.profiles WHERE referral_code = trim(p_code);
  IF v_referrer_profile IS NULL THEN RETURN false; END IF;
  -- Non auto-referral
  IF v_referrer_profile = v_my_profile_id THEN RETURN false; END IF;

  UPDATE public.profiles SET referred_by = v_referrer_profile, updated_at = now()
  WHERE user_id = v_uid;

  -- Incrementa contatori dell'invitante
  UPDATE public.profiles
  SET direct_referrals = direct_referrals + 1,
      total_network = total_network + 1,
      updated_at = now()
  WHERE id = v_referrer_profile;

  -- Ricalcola metriche/livello upline
  PERFORM public.recompute_user_metrics(v_referrer_user);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_referral_code(text) TO authenticated;
