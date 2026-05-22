
-- 1) Update check constraints
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type = ANY (ARRAY[
    'deposit','withdrawal','withdrawal_refund',
    'investment','investment_lock','investment_unlock',
    'interest','yield','referral_bonus','admin_adjustment','investment_return',
    'bonus','fund_investment'
  ]));

ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_direction_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_direction_check
  CHECK (direction = ANY (ARRAY['in','out','internal']));

ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_status_check
  CHECK (status = ANY (ARRAY['pending','completed','failed','rejected']));

-- 2) Rewrite process_matched_deposit (atomic, idempotent, preserves invariant)
CREATE OR REPLACE FUNCTION public.process_matched_deposit(
  p_intent_id uuid, p_tx_id uuid, p_amount numeric, p_tx_hash text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE
  v_user_id uuid;
  v_intent_status text;
  v_balance numeric;
  v_available numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Importo non valido';
  END IF;

  SELECT user_id, status INTO v_user_id, v_intent_status
  FROM public.deposit_intents WHERE id = p_intent_id FOR UPDATE;

  IF NOT FOUND THEN RETURN false; END IF;
  IF v_intent_status <> 'pending' THEN RETURN false; END IF;

  SELECT balance, balance_available INTO v_balance, v_available
  FROM public.profiles WHERE user_id = v_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;

  UPDATE public.deposit_intents
  SET status = 'matched', matched_tx_id = p_tx_id, updated_at = now()
  WHERE id = p_intent_id;

  UPDATE public.detected_transactions
  SET status = 'credited', matched_intent_id = p_intent_id, updated_at = now()
  WHERE id = p_tx_id;

  UPDATE public.profiles SET
    balance = balance + p_amount,
    balance_available = balance_available + p_amount,
    has_confirmed_deposit = true,
    updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  ) VALUES (
    v_user_id, 'deposit', 'in', p_amount, 'USDT', 'completed',
    'Deposito automatico ' || p_amount || ' USDT (tx ' || COALESCE(p_tx_hash,'?') || ')',
    p_intent_id, 'deposit_intent', v_balance + p_amount
  );

  RETURN true;
END;
$fn$;

-- 3) Explicit grants
REVOKE ALL ON FUNCTION public.process_daily_returns() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_daily_returns() TO service_role;

REVOKE ALL ON FUNCTION public.process_matched_deposit(uuid, uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_matched_deposit(uuid, uuid, numeric, text) TO service_role;

REVOKE ALL ON FUNCTION public.create_deposit_intent(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_deposit_intent(numeric, text) TO authenticated;
