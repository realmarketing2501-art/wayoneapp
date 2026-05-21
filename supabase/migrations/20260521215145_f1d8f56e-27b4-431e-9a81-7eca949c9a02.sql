
-- ============================================================
-- AUDIT FIXES — Financial atomic RPCs
-- ============================================================

-- 1) ADMIN APPROVE/REJECT MANUAL DEPOSIT (atomic + ledger)
CREATE OR REPLACE FUNCTION public.admin_approve_manual_deposit(p_deposit_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_dep public.deposits%ROWTYPE;
  v_balance numeric;
  v_available numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT * INTO v_dep FROM public.deposits WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposito non trovato'; END IF;
  IF v_dep.status <> 'pending' THEN
    RAISE EXCEPTION 'Deposito già processato (status=%)', v_dep.status;
  END IF;

  SELECT balance, balance_available INTO v_balance, v_available
  FROM public.profiles WHERE user_id = v_dep.user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo utente non trovato'; END IF;

  UPDATE public.deposits SET
    status = 'confirmed',
    confirmed_at = now(),
    reviewed_by = auth.uid()
  WHERE id = p_deposit_id;

  UPDATE public.profiles SET
    balance = balance + v_dep.amount,
    balance_available = balance_available + v_dep.amount,
    has_confirmed_deposit = true,
    updated_at = now()
  WHERE user_id = v_dep.user_id;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  ) VALUES (
    v_dep.user_id, 'deposit', 'in', v_dep.amount, 'USDT', 'completed',
    'Deposito manuale approvato (' || v_dep.amount || ' USDT)',
    p_deposit_id, 'deposit', v_balance + v_dep.amount
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_manual_deposit(p_deposit_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT status INTO v_status FROM public.deposits WHERE id = p_deposit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposito non trovato'; END IF;
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Deposito già processato (status=%)', v_status;
  END IF;

  UPDATE public.deposits SET
    status = 'rejected', reviewed_by = auth.uid()
  WHERE id = p_deposit_id;

  RETURN true;
END;
$$;

-- 2) ADMIN APPROVE/REJECT WITHDRAWAL
--    Logica scelta: A — saldo già scalato a create_withdrawal.
--    Approvazione = solo cambia stato + tx_hash. Rifiuto = rimborsa il saldo.

CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(p_withdrawal_id uuid, p_tx_hash text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_w public.withdrawals%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT * INTO v_w FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prelievo non trovato'; END IF;
  IF v_w.status <> 'pending' THEN
    RAISE EXCEPTION 'Prelievo già processato (status=%)', v_w.status;
  END IF;

  UPDATE public.withdrawals SET
    status = 'completed',
    reviewed_by = auth.uid(),
    tx_hash = COALESCE(p_tx_hash, tx_hash),
    updated_at = now()
  WHERE id = p_withdrawal_id;

  -- chiudi la transazione pending nel ledger (NO secondo addebito sul saldo)
  UPDATE public.wallet_transactions
  SET status = 'completed',
      description = COALESCE(description,'') ||
        CASE WHEN p_tx_hash IS NOT NULL THEN ' · tx ' || p_tx_hash ELSE '' END
  WHERE reference_id = p_withdrawal_id
    AND reference_type = 'withdrawal'
    AND status = 'pending';

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(p_withdrawal_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_w public.withdrawals%ROWTYPE;
  v_balance numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT * INTO v_w FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prelievo non trovato'; END IF;
  IF v_w.status <> 'pending' THEN
    RAISE EXCEPTION 'Prelievo già processato (status=%)', v_w.status;
  END IF;

  SELECT balance INTO v_balance FROM public.profiles WHERE user_id = v_w.user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo utente non trovato'; END IF;

  UPDATE public.withdrawals SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    updated_at = now()
  WHERE id = p_withdrawal_id;

  -- Rimborsa l'importo lordo (saldo era stato scalato a create_withdrawal)
  UPDATE public.profiles SET
    balance = balance + v_w.amount,
    balance_available = balance_available + v_w.amount,
    updated_at = now()
  WHERE user_id = v_w.user_id;

  -- Marca la transazione pending originale come cancelled
  UPDATE public.wallet_transactions
  SET status = 'cancelled'
  WHERE reference_id = p_withdrawal_id
    AND reference_type = 'withdrawal'
    AND status = 'pending';

  -- Ledger: rimborso
  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  ) VALUES (
    v_w.user_id, 'withdrawal_refund', 'in', v_w.amount, 'USDT', 'completed',
    'Rimborso prelievo rifiutato (' || v_w.amount || ' USDT)',
    p_withdrawal_id, 'withdrawal', v_balance + v_w.amount
  );

  RETURN true;
END;
$$;

-- 3) DAILY RETURNS — atomic per-investment processing
CREATE OR REPLACE FUNCTION public.process_daily_returns()
RETURNS TABLE(processed int, completed int, skipped int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inv record;
  v_balance numeric; v_available numeric; v_locked numeric; v_earned_tot numeric;
  v_rate numeric; v_daily numeric;
  v_new_days int; v_completing boolean;
  v_principal numeric;
  v_proc int := 0; v_comp int := 0; v_skip int := 0;
BEGIN
  FOR v_inv IN
    SELECT id FROM public.investments
    WHERE status = 'active'
      AND (last_payout_at IS NULL OR last_payout_at <= now() - interval '24 hours')
    ORDER BY last_payout_at NULLS FIRST
  LOOP
    -- Lock investment row
    DECLARE i public.investments%ROWTYPE;
    BEGIN
      SELECT * INTO i FROM public.investments WHERE id = v_inv.id FOR UPDATE;

      IF i.status <> 'active' THEN v_skip := v_skip + 1; CONTINUE; END IF;
      IF i.last_payout_at IS NOT NULL AND i.last_payout_at > now() - interval '24 hours' THEN
        v_skip := v_skip + 1; CONTINUE;
      END IF;

      v_rate := COALESCE(i.daily_rate, 0);
      IF v_rate <= 0 THEN v_skip := v_skip + 1; CONTINUE; END IF;

      v_daily := i.amount * v_rate / 100;
      v_new_days := i.days_remaining - 1;
      v_completing := v_new_days <= 0;
      v_principal := CASE WHEN v_completing THEN i.amount ELSE 0 END;

      -- Lock profile
      SELECT balance, balance_available, balance_locked, total_earned
        INTO v_balance, v_available, v_locked, v_earned_tot
      FROM public.profiles WHERE user_id = i.user_id FOR UPDATE;
      IF v_balance IS NULL THEN v_skip := v_skip + 1; CONTINUE; END IF;

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
        last_payout_at = now(),
        updated_at = now()
      WHERE id = i.id;

      INSERT INTO public.wallet_transactions (
        user_id, type, direction, amount, asset, status, description,
        reference_id, reference_type, balance_after
      ) VALUES (
        i.user_id, 'interest', 'in', v_daily, 'USDT', 'completed',
        'Interesse giornaliero ' || i.plan_name || ' (' || v_rate || '%)',
        i.id, 'investment', v_balance + v_daily
      );

      IF v_completing THEN
        INSERT INTO public.wallet_transactions (
          user_id, type, direction, amount, asset, status, description,
          reference_id, reference_type, balance_after
        ) VALUES (
          i.user_id, 'investment_unlock', 'in', v_principal, 'USDT', 'completed',
          'Sblocco capitale ' || i.plan_name,
          i.id, 'investment', v_balance + v_daily
        );
        v_comp := v_comp + 1;
      END IF;

      INSERT INTO public.income_records (user_id, amount, type)
      VALUES (i.user_id, v_daily, 'interest');

      v_proc := v_proc + 1;
    END;
  END LOOP;

  processed := v_proc; completed := v_comp; skipped := v_skip;
  RETURN NEXT;
END;
$$;

-- 4) CREATE_INVESTMENT with POOL CHECK
CREATE OR REPLACE FUNCTION public.create_investment(p_user_id uuid, p_plan_id uuid, p_plan_name text, p_amount numeric, p_duration integer)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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

  -- Lock plan row for pool check
  SELECT * INTO v_plan FROM public.investment_plans WHERE id = p_plan_id FOR UPDATE;
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

  -- Pool check
  IF v_plan.pool_total IS NOT NULL AND v_plan.pool_total > 0
     AND COALESCE(v_plan.pool_filled,0) + p_amount > v_plan.pool_total THEN
    RAISE EXCEPTION 'Pool esaurito: disponibili % USDT', v_plan.pool_total - COALESCE(v_plan.pool_filled,0);
  END IF;

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

  UPDATE public.investment_plans
  SET pool_filled = COALESCE(pool_filled,0) + p_amount
  WHERE id = p_plan_id;

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
$$;

-- 5) DEPOSIT INTENT — server-side unique suffix
CREATE OR REPLACE FUNCTION public.create_deposit_intent(p_amount_usd numeric, p_network text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_wallet text;
  v_service_key text;
  v_cfg jsonb;
  v_suffix numeric;
  v_amount_usdt numeric;
  v_attempt int := 0;
  v_id uuid;
  v_exists boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount_usd IS NULL OR p_amount_usd < 50 THEN
    RAISE EXCEPTION 'Importo minimo deposito: 50 USD';
  END IF;
  IF p_network NOT IN ('TRC-20','ERC-20') THEN
    RAISE EXCEPTION 'Network non supportato';
  END IF;

  v_service_key := CASE p_network WHEN 'TRC-20' THEN 'tron_trc20' ELSE 'eth_erc20' END;

  SELECT config INTO v_cfg FROM public.api_integrations WHERE service_key = v_service_key;
  v_wallet := v_cfg->>'company_wallet';
  IF v_wallet IS NULL OR length(v_wallet) < 10 THEN
    RAISE EXCEPTION 'Wallet aziendale non configurato per %', p_network;
  END IF;

  -- Unique suffix among pending intents on same wallet+network
  LOOP
    v_attempt := v_attempt + 1;
    v_suffix := (1 + floor(random() * 99))::numeric / 100; -- 0.01..0.99
    v_amount_usdt := p_amount_usd + v_suffix;

    SELECT EXISTS (
      SELECT 1 FROM public.deposit_intents
      WHERE status = 'pending'
        AND network = p_network
        AND wallet_address = v_wallet
        AND ABS(amount_usdt - v_amount_usdt) < 0.005
    ) INTO v_exists;

    EXIT WHEN NOT v_exists;
    IF v_attempt > 50 THEN
      RAISE EXCEPTION 'Impossibile generare un importo univoco, riprova fra qualche minuto';
    END IF;
  END LOOP;

  INSERT INTO public.deposit_intents (
    user_id, amount_usd, amount_usdt, unique_suffix, network, wallet_address, status
  ) VALUES (
    v_uid, p_amount_usd, v_amount_usdt, v_suffix, p_network, v_wallet, 'pending'
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
