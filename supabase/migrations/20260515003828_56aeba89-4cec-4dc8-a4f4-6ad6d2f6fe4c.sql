
-- Admin CRUD on special_funds
CREATE POLICY "Admins can insert special_funds" ON public.special_funds
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update special_funds" ON public.special_funds
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete special_funds" ON public.special_funds
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Atomic invest in special fund
CREATE OR REPLACE FUNCTION public.invest_in_fund(p_user_id uuid, p_fund_id uuid, p_amount numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_fund public.special_funds%ROWTYPE;
  v_fund_inv_id uuid;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Importo non valido';
  END IF;

  SELECT * INTO v_fund FROM public.special_funds WHERE id = p_fund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fondo non trovato'; END IF;
  IF v_fund.status <> 'issuing' THEN RAISE EXCEPTION 'Il fondo non è acquistabile'; END IF;
  IF p_amount < v_fund.min_invest THEN
    RAISE EXCEPTION 'Importo minimo: % USDT', v_fund.min_invest;
  END IF;
  IF p_amount > v_fund.max_invest THEN
    RAISE EXCEPTION 'Importo massimo: % USDT', v_fund.max_invest;
  END IF;
  IF v_fund.raised + p_amount > v_fund.goal THEN
    RAISE EXCEPTION 'Quote insufficienti, restano % USDT', v_fund.goal - v_fund.raised;
  END IF;

  SELECT balance_available INTO v_balance FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF p_amount > v_balance THEN RAISE EXCEPTION 'Saldo insufficiente'; END IF;

  UPDATE public.profiles SET
    balance = balance - p_amount,
    balance_available = balance_available - p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.fund_investments (user_id, fund_id, amount, status)
  VALUES (p_user_id, p_fund_id, p_amount, 'active')
  RETURNING id INTO v_fund_inv_id;

  UPDATE public.special_funds SET
    raised = raised + p_amount,
    status = CASE WHEN raised + p_amount >= goal THEN 'sold_out' ELSE status END
  WHERE id = p_fund_id;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  ) VALUES (
    p_user_id, 'fund_investment', 'out', p_amount, 'USDT', 'completed',
    'Acquisto fondo ' || v_fund.name || ' - ' || p_amount || ' USDT',
    v_fund_inv_id, 'fund_investment',
    (SELECT balance FROM public.profiles WHERE user_id = p_user_id)
  );

  RETURN v_fund_inv_id;
END;
$$;
