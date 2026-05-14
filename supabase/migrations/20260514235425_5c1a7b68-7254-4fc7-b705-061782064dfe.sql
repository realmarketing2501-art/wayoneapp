CREATE OR REPLACE FUNCTION public.system_consistency_check()
RETURNS TABLE (
  user_id uuid,
  username text,
  issue_type text,
  severity text,
  expected numeric,
  actual numeric,
  diff numeric,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- 1. balance_locked vs sum of active investments amount
  RETURN QUERY
  SELECT
    p.user_id,
    p.username,
    'balance_locked_mismatch'::text,
    CASE WHEN ABS(COALESCE(p.balance_locked,0) - COALESCE(inv.locked,0)) > 1 THEN 'high' ELSE 'low' END::text,
    COALESCE(inv.locked,0)::numeric,
    COALESCE(p.balance_locked,0)::numeric,
    (COALESCE(p.balance_locked,0) - COALESCE(inv.locked,0))::numeric,
    'Capitale bloccato profilo non corrisponde alla somma investimenti attivi'::text
  FROM profiles p
  LEFT JOIN (
    SELECT user_id, SUM(amount) AS locked
    FROM investments WHERE status = 'active'
    GROUP BY user_id
  ) inv ON inv.user_id = p.user_id
  WHERE ABS(COALESCE(p.balance_locked,0) - COALESCE(inv.locked,0)) > 0.01;

  -- 2. balance vs balance_available + balance_locked
  RETURN QUERY
  SELECT
    p.user_id,
    p.username,
    'balance_split_mismatch'::text,
    'medium'::text,
    (COALESCE(p.balance_available,0) + COALESCE(p.balance_locked,0))::numeric,
    COALESCE(p.balance,0)::numeric,
    (COALESCE(p.balance,0) - (COALESCE(p.balance_available,0) + COALESCE(p.balance_locked,0)))::numeric,
    'balance ≠ balance_available + balance_locked'::text
  FROM profiles p
  WHERE ABS(COALESCE(p.balance,0) - (COALESCE(p.balance_available,0) + COALESCE(p.balance_locked,0))) > 0.01;

  -- 3. units (direct referrals with active investment) mismatch
  RETURN QUERY
  WITH actual_units AS (
    SELECT pa.id AS parent_id, COUNT(DISTINCT pc.id) AS cnt
    FROM profiles pa
    LEFT JOIN profiles pc ON pc.referred_by = pa.id
    LEFT JOIN investments i ON i.user_id = pc.user_id AND i.status = 'active'
    WHERE i.id IS NOT NULL
    GROUP BY pa.id
  )
  SELECT
    p.user_id,
    p.username,
    'units_mismatch'::text,
    'medium'::text,
    COALESCE(au.cnt,0)::numeric,
    COALESCE(p.units,0)::numeric,
    (COALESCE(p.units,0) - COALESCE(au.cnt,0))::numeric,
    'Numero unità MLM non aggiornato rispetto ai diretti attivi'::text
  FROM profiles p
  LEFT JOIN actual_units au ON au.parent_id = p.id
  WHERE COALESCE(p.units,0) <> COALESCE(au.cnt,0);

  -- 4. wallet ledger vs profile balance (sanity)
  RETURN QUERY
  WITH ledger AS (
    SELECT user_id,
      SUM(CASE WHEN direction='in' THEN amount ELSE -amount END) AS net
    FROM wallet_transactions
    WHERE status = 'completed'
    GROUP BY user_id
  )
  SELECT
    p.user_id,
    p.username,
    'ledger_balance_mismatch'::text,
    CASE WHEN ABS(COALESCE(p.balance,0) - COALESCE(l.net,0)) > 1 THEN 'high' ELSE 'low' END::text,
    COALESCE(l.net,0)::numeric,
    COALESCE(p.balance,0)::numeric,
    (COALESCE(p.balance,0) - COALESCE(l.net,0))::numeric,
    'Saldo profilo non corrisponde alla somma del wallet ledger'::text
  FROM profiles p
  LEFT JOIN ledger l ON l.user_id = p.user_id
  WHERE ABS(COALESCE(p.balance,0) - COALESCE(l.net,0)) > 0.01;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.system_consistency_check() TO authenticated;
