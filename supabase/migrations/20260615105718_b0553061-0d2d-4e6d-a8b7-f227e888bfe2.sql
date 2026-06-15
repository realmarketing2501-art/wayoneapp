
-- Estendi check constraint per nuovi tipi
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type = ANY (ARRAY[
    'deposit','withdrawal','withdrawal_refund',
    'investment','investment_lock','investment_unlock','investment_return',
    'interest','yield','bonus','referral_bonus','admin_adjustment',
    'fund_investment','fund_lock','fund_unlock','fund_interest','fund_refund'
  ]));

-- =========================================================
-- 1) DEMO MODE
-- =========================================================
INSERT INTO public.admin_settings (key, value)
VALUES ('demo_mode', 'false')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_demo_mode()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT value FROM public.admin_settings WHERE key='demo_mode'), 'false') = 'true';
$$;

CREATE OR REPLACE FUNCTION public.admin_credit_user(p_user_id uuid, p_amount numeric, p_note text DEFAULT NULL::text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_balance numeric; v_available numeric; v_dir text; v_abs numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Access denied: admin role required'; END IF;
  IF NOT public.is_demo_mode() THEN RAISE EXCEPTION 'Accredito disponibile solo in modalità demo'; END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN RAISE EXCEPTION 'Importo non valido'; END IF;
  IF p_amount < -1000000 OR p_amount > 1000000 THEN RAISE EXCEPTION 'Importo fuori range consentito'; END IF;

  SELECT balance, balance_available INTO v_balance, v_available
  FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF p_amount < 0 AND v_available + p_amount < 0 THEN RAISE EXCEPTION 'Saldo disponibile insufficiente per debito'; END IF;

  v_abs := abs(p_amount);
  v_dir := CASE WHEN p_amount > 0 THEN 'in' ELSE 'out' END;

  UPDATE public.profiles SET
    balance = balance + p_amount,
    balance_available = balance_available + p_amount,
    has_confirmed_deposit = CASE WHEN p_amount > 0 THEN true ELSE has_confirmed_deposit END,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, type, direction, amount, asset, status, description, reference_type, balance_after)
  VALUES (p_user_id, 'admin_adjustment', v_dir, v_abs, 'USDT', 'completed',
    COALESCE(p_note, 'Accredito demo admin') || ' (' || p_amount || ' USDT)', 'admin_adjustment', v_balance + p_amount);
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_wipe_demo_data(p_confirm text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_deleted_users int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Access denied: admin role required'; END IF;
  IF NOT public.is_demo_mode() THEN RAISE EXCEPTION 'Operazione consentita solo in modalità demo'; END IF;
  IF p_confirm IS NULL OR p_confirm <> 'WIPE' THEN RAISE EXCEPTION 'Conferma richiesta: digita WIPE per procedere'; END IF;

  CREATE TEMP TABLE _na ON COMMIT DROP AS
    SELECT u.id FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role='admin'::public.app_role);

  DELETE FROM public.detected_transactions WHERE matched_intent_id IN (SELECT id FROM public.deposit_intents WHERE user_id IN (SELECT id FROM _na));
  DELETE FROM public.wallet_transactions     WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.income_records          WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.investments             WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.fund_investments        WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.deposits                WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.deposit_intents         WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.withdrawals             WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.user_tasks              WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.user_notifications      WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.notifications           WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.wallets                 WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.level_bonus_payouts     WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.signup_events           WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.account_anomalies       WHERE user_id IN (SELECT id FROM _na) OR match_user_id IN (SELECT id FROM _na);
  DELETE FROM public.user_roles              WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM public.profiles                WHERE user_id IN (SELECT id FROM _na);
  DELETE FROM auth.users                     WHERE id IN (SELECT id FROM _na);
  GET DIAGNOSTICS v_deleted_users = ROW_COUNT;

  UPDATE public.investment_plans SET pool_filled = 0;
  UPDATE public.special_funds SET raised = 0,
    status = CASE WHEN status='sold_out' THEN 'issuing' ELSE status END;

  RETURN jsonb_build_object('deleted_users', v_deleted_users);
END; $$;

REVOKE ALL ON FUNCTION public.admin_wipe_demo_data(text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_wipe_demo_data(text) TO authenticated;

-- =========================================================
-- 2) FUND_INVESTMENTS: schema esteso
-- =========================================================
ALTER TABLE public.fund_investments
  ADD COLUMN IF NOT EXISTS daily_rate numeric,
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS days_remaining integer,
  ADD COLUMN IF NOT EXISTS last_payout_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- =========================================================
-- 3) BONIFICA acquisti vecchi (logica errata)
-- =========================================================
DO $$
DECLARE r record; v_bal numeric;
BEGIN
  FOR r IN
    SELECT fi.id, fi.user_id, fi.amount, fi.fund_id, sf.name AS fund_name
    FROM public.fund_investments fi
    JOIN public.special_funds sf ON sf.id = fi.fund_id
    WHERE fi.status='active' AND fi.daily_rate IS NULL
  LOOP
    SELECT balance INTO v_bal FROM public.profiles WHERE user_id=r.user_id FOR UPDATE;
    IF v_bal IS NULL THEN CONTINUE; END IF;

    UPDATE public.profiles SET
      balance = balance + r.amount,
      balance_available = balance_available + r.amount,
      updated_at = now()
    WHERE user_id = r.user_id;

    UPDATE public.fund_investments SET status='cancelled', updated_at=now() WHERE id=r.id;

    UPDATE public.special_funds SET
      raised = GREATEST(0, raised - r.amount),
      status = CASE WHEN status='sold_out' THEN 'issuing' ELSE status END
    WHERE id = r.fund_id;

    INSERT INTO public.wallet_transactions (user_id,type,direction,amount,asset,status,description,reference_id,reference_type,balance_after)
    VALUES (r.user_id,'fund_refund','in',r.amount,'USDT','completed',
      'Rimborso acquisto fondo ' || r.fund_name || ' (migrazione rendimento)',
      r.id,'fund_investment', v_bal + r.amount);
  END LOOP;
END $$;

-- =========================================================
-- 4) invest_in_fund: lock + snapshot rendimento
-- =========================================================
CREATE OR REPLACE FUNCTION public.invest_in_fund(p_user_id uuid, p_fund_id uuid, p_amount numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_available numeric;
  v_fund public.special_funds%ROWTYPE;
  v_fund_inv_id uuid;
  v_uid uuid := auth.uid();
  v_daily_rate numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_user_id IS NULL OR p_user_id <> v_uid THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Importo non valido'; END IF;

  SELECT * INTO v_fund FROM public.special_funds WHERE id=p_fund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fondo non trovato'; END IF;
  IF v_fund.status <> 'issuing' THEN RAISE EXCEPTION 'Il fondo non è acquistabile'; END IF;
  IF p_amount < v_fund.min_invest THEN RAISE EXCEPTION 'Importo minimo: % USDT', v_fund.min_invest; END IF;
  IF p_amount > v_fund.max_invest THEN RAISE EXCEPTION 'Importo massimo: % USDT', v_fund.max_invest; END IF;
  IF v_fund.raised + p_amount > v_fund.goal THEN RAISE EXCEPTION 'Quote insufficienti, restano % USDT', v_fund.goal - v_fund.raised; END IF;
  IF v_fund.duration IS NULL OR v_fund.duration <= 0 THEN RAISE EXCEPTION 'Durata fondo non valida'; END IF;
  IF v_fund.total_return IS NULL OR v_fund.total_return <= 0 THEN RAISE EXCEPTION 'Rendimento totale fondo non valido'; END IF;

  v_daily_rate := round((v_fund.total_return / v_fund.duration)::numeric, 6);

  SELECT balance_available INTO v_available FROM public.profiles WHERE user_id=v_uid FOR UPDATE;
  IF v_available IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF p_amount > v_available THEN RAISE EXCEPTION 'Saldo disponibile insufficiente'; END IF;

  UPDATE public.profiles SET
    balance_available = balance_available - p_amount,
    balance_locked    = balance_locked + p_amount,
    updated_at = now()
  WHERE user_id = v_uid;

  INSERT INTO public.fund_investments (user_id,fund_id,amount,status,daily_rate,duration_days,days_remaining,last_payout_at)
  VALUES (v_uid,p_fund_id,p_amount,'active',v_daily_rate,v_fund.duration,v_fund.duration,now())
  RETURNING id INTO v_fund_inv_id;

  UPDATE public.special_funds SET
    raised = raised + p_amount,
    status = CASE WHEN raised + p_amount >= goal THEN 'sold_out' ELSE status END
  WHERE id = p_fund_id;

  INSERT INTO public.wallet_transactions (user_id,type,direction,amount,asset,status,description,reference_id,reference_type,balance_after)
  VALUES (v_uid,'fund_lock','internal',p_amount,'USDT','completed',
    'Capitale bloccato nel fondo ' || v_fund.name || ' - ' || p_amount || ' USDT (' || v_fund.duration || 'gg @ ' || v_daily_rate || '%/gg)',
    v_fund_inv_id,'fund_investment',(SELECT balance FROM public.profiles WHERE user_id=v_uid));

  RETURN v_fund_inv_id;
END; $$;

-- =========================================================
-- 5) process_daily_returns: include i fondi
-- =========================================================
CREATE OR REPLACE FUNCTION public.process_daily_returns()
RETURNS TABLE(processed integer, completed integer, skipped integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row record;
  v_balance numeric; v_available numeric; v_locked numeric; v_earned_tot numeric;
  v_rate numeric; v_daily numeric;
  v_new_days int; v_completing boolean; v_principal numeric;
  v_proc int := 0; v_comp int := 0; v_skip int := 0;
BEGIN
  -- Investimenti standard
  FOR v_row IN
    SELECT id FROM public.investments
    WHERE status='active' AND (last_payout_at IS NULL OR last_payout_at <= now() - interval '24 hours')
    ORDER BY last_payout_at NULLS FIRST
  LOOP
    DECLARE i public.investments%ROWTYPE;
    BEGIN
      SELECT * INTO i FROM public.investments WHERE id=v_row.id FOR UPDATE;
      IF i.status <> 'active' THEN v_skip:=v_skip+1; CONTINUE; END IF;
      IF i.last_payout_at IS NOT NULL AND i.last_payout_at > now() - interval '24 hours' THEN v_skip:=v_skip+1; CONTINUE; END IF;
      v_rate := COALESCE(i.daily_rate, 0);
      IF v_rate <= 0 THEN v_skip:=v_skip+1; CONTINUE; END IF;

      v_daily := i.amount * v_rate / 100;
      v_new_days := i.days_remaining - 1;
      v_completing := v_new_days <= 0;
      v_principal := CASE WHEN v_completing THEN i.amount ELSE 0 END;

      SELECT balance, balance_available, balance_locked, total_earned
        INTO v_balance, v_available, v_locked, v_earned_tot
      FROM public.profiles WHERE user_id=i.user_id FOR UPDATE;
      IF v_balance IS NULL THEN v_skip:=v_skip+1; CONTINUE; END IF;

      UPDATE public.profiles SET
        balance = v_balance + v_daily,
        balance_available = v_available + v_daily + v_principal,
        balance_locked = GREATEST(0, v_locked - v_principal),
        total_earned = v_earned_tot + v_daily,
        updated_at = now()
      WHERE user_id = i.user_id;

      UPDATE public.investments SET
        earned = COALESCE(earned,0) + v_daily,
        days_remaining = v_new_days,
        status = CASE WHEN v_completing THEN 'completed' ELSE 'active' END,
        last_payout_at = now(), updated_at = now()
      WHERE id = i.id;

      INSERT INTO public.wallet_transactions (user_id,type,direction,amount,asset,status,description,reference_id,reference_type,balance_after)
      VALUES (i.user_id,'interest','in',v_daily,'USDT','completed',
        'Interesse giornaliero ' || i.plan_name || ' (' || v_rate || '%)',
        i.id,'investment', v_balance + v_daily);

      IF v_completing THEN
        INSERT INTO public.wallet_transactions (user_id,type,direction,amount,asset,status,description,reference_id,reference_type,balance_after)
        VALUES (i.user_id,'investment_unlock','internal',v_principal,'USDT','completed',
          'Sblocco capitale ' || i.plan_name, i.id,'investment', v_balance + v_daily);
        v_comp := v_comp + 1;
      END IF;

      INSERT INTO public.income_records (user_id,amount,type) VALUES (i.user_id, v_daily, 'interest');
      v_proc := v_proc + 1;
    END;
  END LOOP;

  -- Fondi speciali
  FOR v_row IN
    SELECT id FROM public.fund_investments
    WHERE status='active' AND daily_rate IS NOT NULL
      AND (last_payout_at IS NULL OR last_payout_at <= now() - interval '24 hours')
    ORDER BY last_payout_at NULLS FIRST
  LOOP
    DECLARE f public.fund_investments%ROWTYPE; v_fund_name text;
    BEGIN
      SELECT * INTO f FROM public.fund_investments WHERE id=v_row.id FOR UPDATE;
      IF f.status <> 'active' THEN v_skip:=v_skip+1; CONTINUE; END IF;
      IF f.last_payout_at IS NOT NULL AND f.last_payout_at > now() - interval '24 hours' THEN v_skip:=v_skip+1; CONTINUE; END IF;
      v_rate := COALESCE(f.daily_rate, 0);
      IF v_rate <= 0 THEN v_skip:=v_skip+1; CONTINUE; END IF;

      v_daily := f.amount * v_rate / 100;
      v_new_days := COALESCE(f.days_remaining,0) - 1;
      v_completing := v_new_days <= 0;
      v_principal := CASE WHEN v_completing THEN f.amount ELSE 0 END;

      SELECT name INTO v_fund_name FROM public.special_funds WHERE id=f.fund_id;

      SELECT balance, balance_available, balance_locked, total_earned
        INTO v_balance, v_available, v_locked, v_earned_tot
      FROM public.profiles WHERE user_id=f.user_id FOR UPDATE;
      IF v_balance IS NULL THEN v_skip:=v_skip+1; CONTINUE; END IF;

      UPDATE public.profiles SET
        balance = v_balance + v_daily,
        balance_available = v_available + v_daily + v_principal,
        balance_locked = GREATEST(0, v_locked - v_principal),
        total_earned = v_earned_tot + v_daily,
        updated_at = now()
      WHERE user_id = f.user_id;

      UPDATE public.fund_investments SET
        total_earned = COALESCE(total_earned,0) + v_daily,
        days_remaining = v_new_days,
        status = CASE WHEN v_completing THEN 'completed' ELSE 'active' END,
        last_payout_at = now(),
        completed_at = CASE WHEN v_completing THEN now() ELSE completed_at END,
        updated_at = now()
      WHERE id = f.id;

      INSERT INTO public.wallet_transactions (user_id,type,direction,amount,asset,status,description,reference_id,reference_type,balance_after)
      VALUES (f.user_id,'fund_interest','in',v_daily,'USDT','completed',
        'Interesse giornaliero fondo ' || COALESCE(v_fund_name,'') || ' (' || v_rate || '%)',
        f.id,'fund_investment', v_balance + v_daily);

      IF v_completing THEN
        INSERT INTO public.wallet_transactions (user_id,type,direction,amount,asset,status,description,reference_id,reference_type,balance_after)
        VALUES (f.user_id,'fund_unlock','internal',v_principal,'USDT','completed',
          'Sblocco capitale fondo ' || COALESCE(v_fund_name,''),
          f.id,'fund_investment', v_balance + v_daily);
        v_comp := v_comp + 1;
      END IF;

      INSERT INTO public.income_records (user_id,amount,type) VALUES (f.user_id, v_daily, 'fund_interest');
      v_proc := v_proc + 1;
    END;
  END LOOP;

  processed := v_proc; completed := v_comp; skipped := v_skip;
  RETURN NEXT;
END; $$;
