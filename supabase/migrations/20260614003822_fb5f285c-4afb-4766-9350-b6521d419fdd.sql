CREATE OR REPLACE FUNCTION public.get_referral_tree(max_depth integer DEFAULT 6)
 RETURNS TABLE(id uuid, user_id uuid, username text, level text, has_confirmed_deposit boolean, created_at timestamp with time zone, direct_referrals integer, referred_by uuid, depth integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT * FROM downline;
END;
$function$;