
-- Add suspension check + tighter wallet format validation to critical RPCs

CREATE OR REPLACE FUNCTION public.create_withdrawal(p_amount numeric, p_wallet_address text, p_type text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_cfg jsonb;
  v_fee_pct numeric;
  v_fee numeric;
  v_net numeric;
  v_wid uuid;
  v_type_valid boolean;
  v_suspended boolean;
  v_addr text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT is_suspended INTO v_suspended FROM public.profiles WHERE user_id = v_user_id;
  IF COALESCE(v_suspended, false) THEN RAISE EXCEPTION 'Account sospeso'; END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Importo non valido'; END IF;
  IF p_wallet_address IS NULL THEN RAISE EXCEPTION 'Indirizzo wallet non valido'; END IF;

  v_addr := trim(p_wallet_address);

  -- Format validation per network type
  IF p_type IN ('fast','medium','slow') THEN
    -- We don't know network from p_type, accept either TRC-20 or ERC-20
    IF NOT (v_addr ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$' OR v_addr ~ '^0x[a-fA-F0-9]{40}$') THEN
      RAISE EXCEPTION 'Indirizzo wallet non valido: deve essere TRC-20 (34 char, inizia con T) o ERC-20 (42 char, inizia con 0x)';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tipo di prelievo non valido';
  END IF;

  SELECT value::jsonb INTO v_cfg FROM public.admin_settings WHERE key = 'withdrawal_config';
  IF v_cfg IS NULL THEN
    v_fee_pct := CASE p_type WHEN 'fast' THEN 20 WHEN 'slow' THEN 5 ELSE 10 END;
    v_type_valid := true;
  ELSE
    SELECT (elem->>'fee_pct')::numeric, true
      INTO v_fee_pct, v_type_valid
    FROM jsonb_array_elements(v_cfg) elem
    WHERE elem->>'key' = p_type AND COALESCE((elem->>'active')::boolean, true)
    LIMIT 1;
  END IF;
  IF NOT COALESCE(v_type_valid,false) OR v_fee_pct IS NULL THEN
    RAISE EXCEPTION 'Tipo di prelievo non valido';
  END IF;

  v_fee := round((p_amount * v_fee_pct / 100)::numeric, 2);
  v_net := p_amount - v_fee;

  SELECT balance_available INTO v_balance
  FROM public.profiles WHERE user_id = v_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF p_amount > v_balance THEN RAISE EXCEPTION 'Saldo insufficiente'; END IF;

  UPDATE public.profiles
  SET balance = balance - p_amount,
      balance_available = balance_available - p_amount,
      updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.withdrawals (user_id, amount, fee, net, wallet_address, type, status)
  VALUES (v_user_id, p_amount, v_fee, v_net, v_addr, p_type, 'pending')
  RETURNING id INTO v_wid;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  ) VALUES (
    v_user_id, 'withdrawal', 'out', p_amount, 'USDT', 'pending',
    'Richiesta prelievo ' || p_amount || ' USDT (fee ' || v_fee || ')',
    v_wid, 'withdrawal', v_balance - p_amount
  );

  RETURN v_wid;
END;
$function$;

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
  v_suspended boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_user_id IS NULL OR p_user_id <> v_uid THEN
    RAISE EXCEPTION 'Access denied: can only invest with own account';
  END IF;

  SELECT is_suspended INTO v_suspended FROM public.profiles WHERE user_id = v_uid;
  IF COALESCE(v_suspended, false) THEN RAISE EXCEPTION 'Account sospeso'; END IF;

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

CREATE OR REPLACE FUNCTION public.invest_in_fund(p_user_id uuid, p_fund_id uuid, p_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_available numeric;
  v_fund public.special_funds%ROWTYPE;
  v_fund_inv_id uuid;
  v_uid uuid := auth.uid();
  v_daily_rate numeric;
  v_suspended boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_user_id IS NULL OR p_user_id <> v_uid THEN RAISE EXCEPTION 'Access denied'; END IF;

  SELECT is_suspended INTO v_suspended FROM public.profiles WHERE user_id = v_uid;
  IF COALESCE(v_suspended, false) THEN RAISE EXCEPTION 'Account sospeso'; END IF;

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
END; $function$;

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
  v_suspended boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT is_suspended INTO v_suspended FROM public.profiles WHERE user_id = v_uid;
  IF COALESCE(v_suspended, false) THEN RAISE EXCEPTION 'Account sospeso'; END IF;

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
