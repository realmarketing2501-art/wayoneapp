
-- 1) PROFILES: drop overly-permissive read policy and restrict to owner
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins keep ability to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) Security-definer function to return only the caller's downline
CREATE OR REPLACE FUNCTION public.get_referral_tree(max_depth int DEFAULT 6)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  username text,
  level text,
  has_confirmed_deposit boolean,
  created_at timestamptz,
  direct_referrals int,
  referred_by uuid,
  depth int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_profile uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT p.id INTO v_my_profile FROM public.profiles p WHERE p.user_id = auth.uid();
  IF v_my_profile IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH RECURSIVE downline AS (
    SELECT p.id, p.user_id, p.username, p.level, p.has_confirmed_deposit,
           p.created_at, p.direct_referrals, p.referred_by, 1 AS depth
    FROM public.profiles p
    WHERE p.referred_by = v_my_profile
    UNION ALL
    SELECT p.id, p.user_id, p.username, p.level, p.has_confirmed_deposit,
           p.created_at, p.direct_referrals, p.referred_by, d.depth + 1
    FROM public.profiles p
    JOIN downline d ON p.referred_by = d.id
    WHERE d.depth < max_depth
  )
  SELECT * FROM downline;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_referral_tree(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_referral_tree(int) TO authenticated;

-- 3) ADMIN_SETTINGS: restrict to admins only
DROP POLICY IF EXISTS "Settings viewable by authenticated" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_settings;

CREATE POLICY "Admins can view settings"
ON public.admin_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public function for whitelisted settings (level_config, withdrawal_config)
CREATE OR REPLACE FUNCTION public.get_public_setting(p_key text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value text;
BEGIN
  IF p_key NOT IN ('level_config', 'withdrawal_config', 'compensation_config') THEN
    RETURN NULL;
  END IF;
  SELECT value INTO v_value FROM public.admin_settings WHERE key = p_key;
  RETURN v_value;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_setting(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_setting(text) TO anon, authenticated;

-- 4) USER_ROLES: explicit admin-only write policies (deny by default for everyone else)
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
