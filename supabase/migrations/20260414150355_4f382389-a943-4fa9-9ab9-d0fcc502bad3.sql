
-- Secure investment creation function
CREATE OR REPLACE FUNCTION public.create_investment(
  p_user_id uuid,
  p_plan_id uuid,
  p_plan_name text,
  p_amount numeric,
  p_duration integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance numeric;
  v_investment_id uuid;
BEGIN
  -- Lock and check balance
  SELECT balance_available INTO v_balance
  FROM profiles WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Profilo non trovato';
  END IF;

  IF p_amount > v_balance THEN
    RAISE EXCEPTION 'Saldo insufficiente: hai % USDT disponibili', v_balance;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Importo non valido';
  END IF;

  -- Deduct balance
  UPDATE profiles SET
    balance = balance - p_amount,
    balance_available = balance_available - p_amount,
    balance_locked = balance_locked + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Create investment
  INSERT INTO investments (user_id, plan_id, plan_name, amount, days_remaining, status)
  VALUES (p_user_id, p_plan_id, p_plan_name, p_amount, p_duration, 'active')
  RETURNING id INTO v_investment_id;

  -- Ledger entry
  INSERT INTO wallet_transactions (user_id, type, direction, amount, asset, status, description, reference_id, reference_type, balance_after)
  VALUES (p_user_id, 'investment', 'out', p_amount, 'USDT', 'completed',
    'Investimento ' || p_plan_name || ' - ' || p_amount || ' USDT',
    v_investment_id, 'investment',
    v_balance - p_amount);

  RETURN v_investment_id;
END;
$$;
