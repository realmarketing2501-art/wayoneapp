
-- 1) Fix profilo corrotto: ricalcola balance_locked e balance da fonti autoritative
DO $$
DECLARE
  v_uid uuid := 'fdd53a51-455e-40c5-b253-f9b49cf4c27f';
  v_locked numeric;
  v_available numeric;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO v_locked
  FROM public.investments WHERE user_id = v_uid AND status = 'active';

  SELECT GREATEST(0, COALESCE(balance_available,0)) INTO v_available
  FROM public.profiles WHERE user_id = v_uid;

  UPDATE public.profiles
  SET balance_locked = v_locked,
      balance_available = v_available,
      balance = v_available + v_locked,
      updated_at = now()
  WHERE user_id = v_uid;
END $$;

-- 2) Normalizza ledger storico per allineare gli invarianti
UPDATE public.wallet_transactions
SET type = 'investment_lock', direction = 'internal'
WHERE type = 'investment' AND direction = 'out' AND reference_type = 'investment';

UPDATE public.wallet_transactions
SET direction = 'internal'
WHERE type = 'investment_unlock' AND direction = 'in';
