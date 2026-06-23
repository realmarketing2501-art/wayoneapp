
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
CHECK (type = ANY (ARRAY[
  'deposit','withdrawal','withdrawal_refund',
  'investment','investment_lock','investment_unlock','investment_return',
  'interest','yield','bonus','referral_bonus','referral_commission',
  'admin_adjustment',
  'fund_investment','fund_lock','fund_unlock','fund_interest','fund_refund'
]));

ALTER TABLE public.income_records DROP CONSTRAINT IF EXISTS income_records_type_check;
ALTER TABLE public.income_records ADD CONSTRAINT income_records_type_check
CHECK (type = ANY (ARRAY[
  'interest','fund_interest','team','level_bonus','bonus','referral_commission','referral_bonus'
]));

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('daily-returns-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'daily-returns-hourly',
  '0 * * * *',
  $$SELECT public.process_daily_returns();$$
);

DROP FUNCTION IF EXISTS public.get_referral_tree(integer);

CREATE OR REPLACE FUNCTION public.get_referral_tree(max_depth integer DEFAULT 6)
RETURNS TABLE(
  id uuid, user_id uuid, username text, level text,
  has_confirmed_deposit boolean, created_at timestamptz,
  direct_referrals integer, referred_by uuid, depth integer,
  referred_by_username text,
  active_investments integer,
  total_invested numeric,
  total_earned numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_my_profile uuid;
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
  ),
  inv_agg AS (
    SELECT user_id,
           COUNT(*) FILTER (WHERE status='active')::int AS active_cnt,
           COALESCE(SUM(amount) FILTER (WHERE status='active'),0)::numeric AS invested,
           COALESCE(SUM(earned),0)::numeric AS earned
    FROM public.investments GROUP BY user_id
  ),
  fund_agg AS (
    SELECT user_id,
           COUNT(*) FILTER (WHERE status='active')::int AS active_cnt,
           COALESCE(SUM(amount) FILTER (WHERE status='active'),0)::numeric AS invested,
           COALESCE(SUM(total_earned),0)::numeric AS earned
    FROM public.fund_investments GROUP BY user_id
  )
  SELECT d.id, d.user_id, d.username, d.level, d.has_confirmed_deposit,
         d.created_at, d.direct_referrals, d.referred_by, d.depth,
         pr.username AS referred_by_username,
         COALESCE(i.active_cnt,0) + COALESCE(f.active_cnt,0) AS active_investments,
         COALESCE(i.invested,0) + COALESCE(f.invested,0) AS total_invested,
         COALESCE(i.earned,0) + COALESCE(f.earned,0) AS total_earned
  FROM downline d
  LEFT JOIN public.profiles pr ON pr.id = d.referred_by
  LEFT JOIN inv_agg i ON i.user_id = d.user_id
  LEFT JOIN fund_agg f ON f.user_id = d.user_id;
END;
$$;

SELECT public.process_daily_returns();
