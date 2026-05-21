-- 1) Blocca INSERT diretto su deposit_intents
DROP POLICY IF EXISTS "Users can create own deposit intents" ON public.deposit_intents;

-- 2) Proteggi process_daily_returns
REVOKE ALL ON FUNCTION public.process_daily_returns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_daily_returns() FROM anon;
REVOKE ALL ON FUNCTION public.process_daily_returns() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_daily_returns() TO service_role;

-- 3) create_deposit_intent: suffissi distanziati 0.10 + collision check 0.06
CREATE OR REPLACE FUNCTION public.create_deposit_intent(p_amount_usd numeric, p_network text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Suffissi distanziati di 0.10: {0.10, 0.20, ..., 0.90}
  LOOP
    v_attempt := v_attempt + 1;
    v_suffix := ((1 + floor(random()*9))::numeric) / 10;
    v_amount_usdt := p_amount_usd + v_suffix;

    SELECT EXISTS (
      SELECT 1 FROM public.deposit_intents
      WHERE status = 'pending'
        AND network = p_network
        AND wallet_address = v_wallet
        AND ABS(amount_usdt - v_amount_usdt) < 0.06
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
$function$;

-- 4) create_investment: NON ridurre balance, solo available -> locked
CREATE OR REPLACE FUNCTION public.create_investment(p_user_id uuid, p_plan_id uuid, p_plan_name text, p_amount numeric, p_duration integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_available numeric;
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

  IF v_plan.pool_total IS NOT NULL AND v_plan.pool_total > 0
     AND COALESCE(v_plan.pool_filled,0) + p_amount > v_plan.pool_total THEN
    RAISE EXCEPTION 'Pool esaurito: disponibili % USDT', v_plan.pool_total - COALESCE(v_plan.pool_filled,0);
  END IF;

  SELECT balance_available INTO v_available FROM public.profiles WHERE user_id = v_uid FOR UPDATE;
  IF v_available IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF p_amount > v_available THEN RAISE EXCEPTION 'Saldo disponibile insufficiente: % USDT', v_available; END IF;

  -- balance INVARIATO; sposta solo available -> locked
  UPDATE public.profiles SET
    balance_available = balance_available - p_amount,
    balance_locked    = balance_locked + p_amount,
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

  -- Ledger: movimento INTERNO (lock), non uscita patrimoniale
  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  ) VALUES (
    v_uid, 'investment_lock', 'internal', p_amount, 'USDT', 'completed',
    'Capitale bloccato in ' || v_plan.name || ' - ' || p_amount || ' USDT (' || v_duration || 'gg @ ' || v_daily_rate || '%/gg)',
    v_investment_id, 'investment',
    (SELECT balance FROM public.profiles WHERE user_id = v_uid)
  );

  RETURN v_investment_id;
END;
$function$;

-- 5) process_daily_returns: il ledger unlock è anch'esso INTERNO
CREATE OR REPLACE FUNCTION public.process_daily_returns()
 RETURNS TABLE(processed integer, completed integer, skipped integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

      SELECT balance, balance_available, balance_locked, total_earned
        INTO v_balance, v_available, v_locked, v_earned_tot
      FROM public.profiles WHERE user_id = i.user_id FOR UPDATE;
      IF v_balance IS NULL THEN v_skip := v_skip + 1; CONTINUE; END IF;

      -- balance += interesse (vero guadagno); principal torna da locked a available senza toccare balance
      UPDATE public.profiles SET
        balance           = v_balance + v_daily,
        balance_available = v_available + v_daily + v_principal,
        balance_locked    = GREATEST(0, v_locked - v_principal),
        total_earned      = v_earned_tot + v_daily,
        updated_at = now()
      WHERE user_id = i.user_id;

      UPDATE public.investments SET
        earned = COALESCE(earned,0) + v_daily,
        days_remaining = v_new_days,
        status = CASE WHEN v_completing THEN 'completed' ELSE 'active' END,
        last_payout_at = now(),
        updated_at = now()
      WHERE id = i.id;

      -- Interesse = entrata reale
      INSERT INTO public.wallet_transactions (
        user_id, type, direction, amount, asset, status, description,
        reference_id, reference_type, balance_after
      ) VALUES (
        i.user_id, 'interest', 'in', v_daily, 'USDT', 'completed',
        'Interesse giornaliero ' || i.plan_name || ' (' || v_rate || '%)',
        i.id, 'investment', v_balance + v_daily
      );

      IF v_completing THEN
        -- Sblocco capitale = movimento INTERNO (locked -> available), non entrata patrimoniale
        INSERT INTO public.wallet_transactions (
          user_id, type, direction, amount, asset, status, description,
          reference_id, reference_type, balance_after
        ) VALUES (
          i.user_id, 'investment_unlock', 'internal', v_principal, 'USDT', 'completed',
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
$function$;

-- 6) system_consistency_check: ignora movimenti interni nel sum del ledger
CREATE OR REPLACE FUNCTION public.system_consistency_check()
 RETURNS TABLE(user_id uuid, username text, issue_type text, severity text, expected numeric, actual numeric, diff numeric, details text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.username, 'balance_locked_mismatch'::text,
    CASE WHEN ABS(COALESCE(p.balance_locked,0) - COALESCE(inv.locked,0)) > 1 THEN 'high' ELSE 'low' END::text,
    COALESCE(inv.locked,0)::numeric, COALESCE(p.balance_locked,0)::numeric,
    (COALESCE(p.balance_locked,0) - COALESCE(inv.locked,0))::numeric,
    'Capitale bloccato profilo non corrisponde alla somma investimenti attivi'::text
  FROM profiles p
  LEFT JOIN (SELECT user_id, SUM(amount) AS locked FROM investments WHERE status='active' GROUP BY user_id) inv
    ON inv.user_id = p.user_id
  WHERE ABS(COALESCE(p.balance_locked,0) - COALESCE(inv.locked,0)) > 0.01;

  RETURN QUERY
  SELECT p.user_id, p.username, 'balance_split_mismatch'::text, 'medium'::text,
    (COALESCE(p.balance_available,0) + COALESCE(p.balance_locked,0))::numeric,
    COALESCE(p.balance,0)::numeric,
    (COALESCE(p.balance,0) - (COALESCE(p.balance_available,0) + COALESCE(p.balance_locked,0)))::numeric,
    'balance ≠ balance_available + balance_locked'::text
  FROM profiles p
  WHERE ABS(COALESCE(p.balance,0) - (COALESCE(p.balance_available,0) + COALESCE(p.balance_locked,0))) > 0.01;

  RETURN QUERY
  WITH actual_units AS (
    SELECT pa.id AS parent_id, COUNT(DISTINCT pc.id) AS cnt
    FROM profiles pa
    LEFT JOIN profiles pc ON pc.referred_by = pa.id
    LEFT JOIN investments i ON i.user_id = pc.user_id AND i.status = 'active'
    WHERE i.id IS NOT NULL
    GROUP BY pa.id
  )
  SELECT p.user_id, p.username, 'units_mismatch'::text, 'medium'::text,
    COALESCE(au.cnt,0)::numeric, COALESCE(p.units,0)::numeric,
    (COALESCE(p.units,0) - COALESCE(au.cnt,0))::numeric,
    'Numero unità MLM non aggiornato rispetto ai diretti attivi'::text
  FROM profiles p
  LEFT JOIN actual_units au ON au.parent_id = p.id
  WHERE COALESCE(p.units,0) <> COALESCE(au.cnt,0);

  -- Ledger: solo movimenti esterni (in/out), escludi internal
  RETURN QUERY
  WITH ledger AS (
    SELECT wt.user_id,
      SUM(CASE WHEN direction='in' THEN amount
               WHEN direction='out' THEN -amount
               ELSE 0 END) AS net
    FROM wallet_transactions wt
    WHERE status = 'completed'
      AND direction IN ('in','out')
    GROUP BY wt.user_id
  )
  SELECT p.user_id, p.username, 'ledger_balance_mismatch'::text,
    CASE WHEN ABS(COALESCE(p.balance,0) - COALESCE(l.net,0)) > 1 THEN 'high' ELSE 'low' END::text,
    COALESCE(l.net,0)::numeric, COALESCE(p.balance,0)::numeric,
    (COALESCE(p.balance,0) - COALESCE(l.net,0))::numeric,
    'Saldo profilo non corrisponde alla somma del wallet ledger (escl. movimenti interni)'::text
  FROM profiles p
  LEFT JOIN ledger l ON l.user_id = p.user_id
  WHERE ABS(COALESCE(p.balance,0) - COALESCE(l.net,0)) > 0.01;

  RETURN;
END;
$function$;