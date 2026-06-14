
CREATE OR REPLACE FUNCTION public.admin_credit_user(
  p_user_id uuid,
  p_amount numeric,
  p_note text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_available numeric;
  v_dir text;
  v_abs numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'Importo non valido';
  END IF;
  IF p_amount < -1000000 OR p_amount > 1000000 THEN
    RAISE EXCEPTION 'Importo fuori range consentito';
  END IF;

  SELECT balance, balance_available INTO v_balance, v_available
  FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;

  IF p_amount < 0 AND v_available + p_amount < 0 THEN
    RAISE EXCEPTION 'Saldo disponibile insufficiente per debito';
  END IF;

  v_abs := abs(p_amount);
  v_dir := CASE WHEN p_amount > 0 THEN 'in' ELSE 'out' END;

  UPDATE public.profiles SET
    balance = balance + p_amount,
    balance_available = balance_available + p_amount,
    has_confirmed_deposit = CASE WHEN p_amount > 0 THEN true ELSE has_confirmed_deposit END,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_type, balance_after
  ) VALUES (
    p_user_id, 'admin_adjustment', v_dir, v_abs, 'USDT', 'completed',
    COALESCE(p_note, 'Accredito test admin') || ' (' || p_amount || ' USDT)',
    'admin_adjustment', v_balance + p_amount
  );

  RETURN true;
END;
$$;
