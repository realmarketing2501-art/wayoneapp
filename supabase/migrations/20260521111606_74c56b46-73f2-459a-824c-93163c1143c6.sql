
-- 1) FIX CRITICAL: admin_delete_user requires admin role
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  DELETE FROM wallet_transactions WHERE user_id = p_user_id;
  DELETE FROM income_records WHERE user_id = p_user_id;
  DELETE FROM investments WHERE user_id = p_user_id;
  DELETE FROM deposit_intents WHERE user_id = p_user_id;
  DELETE FROM deposits WHERE user_id = p_user_id;
  DELETE FROM withdrawals WHERE user_id = p_user_id;
  DELETE FROM fund_investments WHERE user_id = p_user_id;
  DELETE FROM user_tasks WHERE user_id = p_user_id;
  DELETE FROM user_notifications WHERE user_id = p_user_id;
  DELETE FROM wallets WHERE user_id = p_user_id;
  DELETE FROM user_roles WHERE user_id = p_user_id;
  DELETE FROM profiles WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN true;
END;
$function$;

-- 2) FIX CRITICAL: create_investment must use auth.uid()
CREATE OR REPLACE FUNCTION public.create_investment(p_user_id uuid, p_plan_id uuid, p_plan_name text, p_amount numeric, p_duration integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
  v_plan public.investment_plans%ROWTYPE;
  v_daily_rate numeric;
  v_duration integer;
  v_investment_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_user_id IS NULL OR p_user_id <> v_uid THEN
    RAISE EXCEPTION 'Access denied: can only invest with own account';
  END IF;

  SELECT * INTO v_plan FROM public.investment_plans WHERE id = p_plan_id;
  IF NOT FOUND OR v_plan.status <> 'active' THEN
    RAISE EXCEPTION 'Piano non valido o non attivo';
  END IF;

  v_duration := COALESCE(v_plan.duration_days, v_plan.duration, p_duration);
  v_daily_rate := v_plan.daily_return;

  IF v_daily_rate IS NULL OR v_daily_rate <= 0 THEN RAISE EXCEPTION 'Piano senza rendimento giornaliero configurato'; END IF;
  IF v_duration IS NULL OR v_duration <= 0 THEN RAISE EXCEPTION 'Durata del piano non valida'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Importo non valido'; END IF;
  IF v_plan.min_invest IS NOT NULL AND p_amount < v_plan.min_invest THEN RAISE EXCEPTION 'Importo minimo per % è % USDT', v_plan.name, v_plan.min_invest; END IF;
  IF v_plan.max_invest IS NOT NULL AND p_amount > v_plan.max_invest THEN RAISE EXCEPTION 'Importo massimo per % è % USDT', v_plan.name, v_plan.max_invest; END IF;

  SELECT balance_available INTO v_balance FROM public.profiles WHERE user_id = v_uid FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF p_amount > v_balance THEN RAISE EXCEPTION 'Saldo insufficiente: hai % USDT disponibili', v_balance; END IF;

  UPDATE public.profiles SET
    balance = balance - p_amount,
    balance_available = balance_available - p_amount,
    balance_locked = balance_locked + p_amount,
    updated_at = now()
  WHERE user_id = v_uid;

  INSERT INTO public.investments (
    user_id, plan_id, plan_name, amount, days_remaining, status,
    last_payout_at, duration_days, daily_rate
  ) VALUES (
    v_uid, p_plan_id, v_plan.name, p_amount, v_duration, 'active',
    now(), v_duration, v_daily_rate
  ) RETURNING id INTO v_investment_id;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  ) VALUES (
    v_uid, 'investment', 'out', p_amount, 'USDT', 'completed',
    'Investimento ' || v_plan.name || ' - ' || p_amount || ' USDT (' || v_duration || 'gg @ ' || v_daily_rate || '%/gg)',
    v_investment_id, 'investment', v_balance - p_amount
  );

  RETURN v_investment_id;
END;
$function$;

-- 3) FIX CRITICAL: invest_in_fund must use auth.uid()
CREATE OR REPLACE FUNCTION public.invest_in_fund(p_user_id uuid, p_fund_id uuid, p_amount numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
  v_fund public.special_funds%ROWTYPE;
  v_fund_inv_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_user_id IS NULL OR p_user_id <> v_uid THEN
    RAISE EXCEPTION 'Access denied: can only invest with own account';
  END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Importo non valido'; END IF;

  SELECT * INTO v_fund FROM public.special_funds WHERE id = p_fund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fondo non trovato'; END IF;
  IF v_fund.status <> 'issuing' THEN RAISE EXCEPTION 'Il fondo non è acquistabile'; END IF;
  IF p_amount < v_fund.min_invest THEN RAISE EXCEPTION 'Importo minimo: % USDT', v_fund.min_invest; END IF;
  IF p_amount > v_fund.max_invest THEN RAISE EXCEPTION 'Importo massimo: % USDT', v_fund.max_invest; END IF;
  IF v_fund.raised + p_amount > v_fund.goal THEN RAISE EXCEPTION 'Quote insufficienti, restano % USDT', v_fund.goal - v_fund.raised; END IF;

  SELECT balance_available INTO v_balance FROM public.profiles WHERE user_id = v_uid FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF p_amount > v_balance THEN RAISE EXCEPTION 'Saldo insufficiente'; END IF;

  UPDATE public.profiles SET
    balance = balance - p_amount,
    balance_available = balance_available - p_amount,
    updated_at = now()
  WHERE user_id = v_uid;

  INSERT INTO public.fund_investments (user_id, fund_id, amount, status)
  VALUES (v_uid, p_fund_id, p_amount, 'active')
  RETURNING id INTO v_fund_inv_id;

  UPDATE public.special_funds SET
    raised = raised + p_amount,
    status = CASE WHEN raised + p_amount >= goal THEN 'sold_out' ELSE status END
  WHERE id = p_fund_id;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  ) VALUES (
    v_uid, 'fund_investment', 'out', p_amount, 'USDT', 'completed',
    'Acquisto fondo ' || v_fund.name || ' - ' || p_amount || ' USDT',
    v_fund_inv_id, 'fund_investment',
    (SELECT balance FROM public.profiles WHERE user_id = v_uid)
  );

  RETURN v_fund_inv_id;
END;
$function$;

-- 4) Lock down internal SECURITY DEFINER functions (revoke from anon/authenticated)
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.award_level_bonus(uuid, level_name) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_user_metrics(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_matched_deposit(uuid, uuid, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_old_deposit_intents() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_award_level_bonus_on_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_recompute_upline_on_investment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_sensitive_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.system_consistency_check() FROM PUBLIC, anon;
