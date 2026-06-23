CREATE OR REPLACE FUNCTION public.get_referral_tree(max_depth integer DEFAULT 6)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  level text,
  has_confirmed_deposit boolean,
  created_at timestamp with time zone,
  direct_referrals integer,
  referred_by uuid,
  depth integer,
  referred_by_username text,
  active_investments integer,
  total_invested numeric,
  total_earned numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_my_profile uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT p.id
    INTO v_my_profile
  FROM public.profiles AS p
  WHERE p.user_id = auth.uid();

  IF v_my_profile IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH RECURSIVE downline(
    d_id,
    d_user_id,
    d_username,
    d_level,
    d_has_confirmed_deposit,
    d_created_at,
    d_direct_referrals,
    d_referred_by,
    d_depth
  ) AS (
    SELECT
      p.id,
      p.user_id,
      p.username,
      p.level::text,
      p.has_confirmed_deposit,
      p.created_at,
      p.direct_referrals,
      p.referred_by,
      1::integer
    FROM public.profiles AS p
    WHERE p.referred_by = v_my_profile

    UNION ALL

    SELECT
      p.id,
      p.user_id,
      p.username,
      p.level::text,
      p.has_confirmed_deposit,
      p.created_at,
      p.direct_referrals,
      p.referred_by,
      (d.d_depth + 1)::integer
    FROM public.profiles AS p
    JOIN downline AS d ON p.referred_by = d.d_id
    WHERE d.d_depth < max_depth
  ),
  inv_agg AS (
    SELECT
      inv.user_id AS inv_user_id,
      COUNT(*) FILTER (WHERE inv.status = 'active')::integer AS active_cnt,
      COALESCE(SUM(inv.amount) FILTER (WHERE inv.status = 'active'), 0)::numeric AS invested,
      COALESCE(SUM(inv.earned), 0)::numeric AS earned
    FROM public.investments AS inv
    GROUP BY inv.user_id
  ),
  fund_agg AS (
    SELECT
      fi.user_id AS fund_user_id,
      COUNT(*) FILTER (WHERE fi.status = 'active')::integer AS active_cnt,
      COALESCE(SUM(fi.amount) FILTER (WHERE fi.status = 'active'), 0)::numeric AS invested,
      COALESCE(SUM(fi.total_earned), 0)::numeric AS earned
    FROM public.fund_investments AS fi
    GROUP BY fi.user_id
  )
  SELECT
    d.d_id AS id,
    d.d_user_id AS user_id,
    d.d_username AS username,
    d.d_level AS level,
    d.d_has_confirmed_deposit AS has_confirmed_deposit,
    d.d_created_at AS created_at,
    d.d_direct_referrals AS direct_referrals,
    d.d_referred_by AS referred_by,
    d.d_depth AS depth,
    sponsor.username AS referred_by_username,
    (COALESCE(i.active_cnt, 0) + COALESCE(f.active_cnt, 0))::integer AS active_investments,
    (COALESCE(i.invested, 0) + COALESCE(f.invested, 0))::numeric AS total_invested,
    (COALESCE(i.earned, 0) + COALESCE(f.earned, 0))::numeric AS total_earned
  FROM downline AS d
  LEFT JOIN public.profiles AS sponsor ON sponsor.id = d.d_referred_by
  LEFT JOIN inv_agg AS i ON i.inv_user_id = d.d_user_id
  LEFT JOIN fund_agg AS f ON f.fund_user_id = d.d_user_id
  ORDER BY d.d_depth ASC, d.d_created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_tree(integer) TO authenticated;