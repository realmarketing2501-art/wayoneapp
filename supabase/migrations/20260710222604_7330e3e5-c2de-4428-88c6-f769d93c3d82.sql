
-- BACKUP
CREATE TABLE public._backup_pre_migration_20260710_profiles           AS TABLE public.profiles;
CREATE TABLE public._backup_pre_migration_20260710_investments        AS TABLE public.investments;
CREATE TABLE public._backup_pre_migration_20260710_investment_plans   AS TABLE public.investment_plans;
CREATE TABLE public._backup_pre_migration_20260710_wallet_transactions AS TABLE public.wallet_transactions;
CREATE TABLE public._backup_pre_migration_20260710_income_records     AS TABLE public.income_records;
CREATE TABLE public._backup_pre_migration_20260710_admin_settings     AS TABLE public.admin_settings;
REVOKE ALL ON public._backup_pre_migration_20260710_profiles,
              public._backup_pre_migration_20260710_investments,
              public._backup_pre_migration_20260710_investment_plans,
              public._backup_pre_migration_20260710_wallet_transactions,
              public._backup_pre_migration_20260710_income_records,
              public._backup_pre_migration_20260710_admin_settings
  FROM authenticated, anon;
GRANT ALL ON public._backup_pre_migration_20260710_profiles,
             public._backup_pre_migration_20260710_investments,
             public._backup_pre_migration_20260710_investment_plans,
             public._backup_pre_migration_20260710_wallet_transactions,
             public._backup_pre_migration_20260710_income_records,
             public._backup_pre_migration_20260710_admin_settings
  TO service_role;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS network_balance numeric NOT NULL DEFAULT 0;
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS is_legacy boolean NOT NULL DEFAULT false;
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS migration_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_daily_rate numeric;
UPDATE public.investments SET locked_daily_rate = COALESCE(locked_daily_rate, daily_rate) WHERE locked_daily_rate IS NULL;
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS accrual_date date,
  ADD COLUMN IF NOT EXISTS source_balance text
    CHECK (source_balance IS NULL OR source_balance IN ('available','network'));
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS source_balance text NOT NULL DEFAULT 'available'
    CHECK (source_balance IN ('available','network'));

CREATE UNIQUE INDEX IF NOT EXISTS ux_wtx_daily_interest
  ON public.wallet_transactions (reference_id, accrual_date)
  WHERE type = 'interest' AND reference_type = 'investment' AND accrual_date IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_wtx_daily_fund_interest
  ON public.wallet_transactions (reference_id, accrual_date)
  WHERE type = 'fund_interest' AND reference_type = 'fund_investment' AND accrual_date IS NOT NULL;

UPDATE public.investment_plans SET is_legacy = true, status = 'inactive'
WHERE id IN (
  'fdef1af9-a581-45f6-a98b-a694a240623e','7f7f99f3-6964-431f-baf9-799a4257ff7b',
  '6970d6ee-16f1-4026-a182-f1d21675088c','11111111-1111-1111-1111-111111111111'
);
INSERT INTO public.investment_plans (id, name, duration, duration_days, daily_return, min_invest, max_invest, pool_total, pool_filled, status, is_legacy) VALUES
  (gen_random_uuid(), 'Oneway Start', 90, 90, 0.40,   50,   500, 0, 0, 'active', false),
  (gen_random_uuid(), 'Oneway Plus',  90, 90, 0.50,  500,  2000, 0, 0, 'active', false),
  (gen_random_uuid(), 'Oneway Pro',   90, 90, 0.60, 2000,  5000, 0, 0, 'active', false),
  (gen_random_uuid(), 'Oneway Elite', 90, 90, 0.70, 5000, 10000, 0, 0, 'active', false),
  (gen_random_uuid(), 'Oneway Prime', 90, 90, 0.80,10000,100000, 0, 0, 'active', false);

INSERT INTO public.admin_settings (key, value) VALUES
  ('network_l1_pct', '5'),('network_l2_pct', '3'),('network_l3_pct', '2'),
  ('network_l4_pct', '1'),('network_l5_pct', '1'),
  ('reinvest_min_amount', '50'),('withdraw_min_amount', '50')
ON CONFLICT (key) DO NOTHING;

UPDATE public.investments SET migration_start_at = now()
WHERE status = 'active' AND migration_start_at IS NULL;

DO $$
DECLARE v_conname text;
BEGIN
  SELECT conname INTO v_conname FROM pg_constraint
   WHERE conrelid='public.wallet_transactions'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%type%';
  IF v_conname IS NOT NULL THEN EXECUTE 'ALTER TABLE public.wallet_transactions DROP CONSTRAINT '||quote_ident(v_conname); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='wallet_transactions_type_check2') THEN
    ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check2
      CHECK (type IN ('deposit','withdrawal','interest','fund_interest','investment_lock','investment_unlock','fund_lock','fund_unlock','fund_investment','fund_refund','bonus','referral_commission','network_commission','admin_adjustment','reinvestment'));
  END IF;
END $$;

DO $$
DECLARE v_conname text;
BEGIN
  SELECT conname INTO v_conname FROM pg_constraint
   WHERE conrelid='public.income_records'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%type%';
  IF v_conname IS NOT NULL THEN EXECUTE 'ALTER TABLE public.income_records DROP CONSTRAINT '||quote_ident(v_conname); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='income_records_type_check2') THEN
    ALTER TABLE public.income_records ADD CONSTRAINT income_records_type_check2
      CHECK (type IN ('interest','fund_interest','referral_commission','network_commission','level_bonus','bonus'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.distribute_network_commissions(
  p_earner_user_id uuid, p_earn_amount numeric, p_source_label text,
  p_ref_id uuid, p_ref_type text, p_accrual_date date
) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current_profile uuid; v_visited uuid[] := ARRAY[]::uuid[];
  v_level int := 0; v_pct numeric; v_key text; v_commission numeric;
  v_total numeric := 0; v_sponsor_user uuid; v_sponsor_suspended boolean;
  v_sponsor_next uuid; v_bal numeric; v_earner_name text;
BEGIN
  IF p_earn_amount IS NULL OR p_earn_amount <= 0 THEN RETURN 0; END IF;
  SELECT referred_by, username INTO v_current_profile, v_earner_name FROM public.profiles WHERE user_id = p_earner_user_id;
  WHILE v_current_profile IS NOT NULL AND v_level < 5 LOOP
    v_level := v_level + 1;
    IF v_current_profile = ANY(v_visited) THEN EXIT; END IF;
    v_visited := array_append(v_visited, v_current_profile);
    SELECT user_id, is_suspended, referred_by INTO v_sponsor_user, v_sponsor_suspended, v_sponsor_next
    FROM public.profiles WHERE id = v_current_profile;
    EXIT WHEN v_sponsor_user IS NULL;
    IF NOT COALESCE(v_sponsor_suspended, false) THEN
      v_key := 'network_l' || v_level || '_pct';
      SELECT COALESCE(NULLIF(value,'')::numeric, 0) INTO v_pct FROM public.admin_settings WHERE key = v_key;
      v_pct := COALESCE(v_pct, 0);
      IF v_pct > 0 THEN
        v_commission := round((p_earn_amount * v_pct / 100)::numeric, 6);
        IF v_commission > 0 THEN
          SELECT network_balance INTO v_bal FROM public.profiles WHERE user_id = v_sponsor_user FOR UPDATE;
          UPDATE public.profiles SET
            network_balance = COALESCE(network_balance,0) + v_commission,
            total_earned    = COALESCE(total_earned,0) + v_commission,
            updated_at = now()
          WHERE user_id = v_sponsor_user;
          INSERT INTO public.wallet_transactions (
            user_id, type, direction, amount, asset, status, description,
            reference_id, reference_type, balance_after, accrual_date, source_balance
          ) VALUES (
            v_sponsor_user, 'network_commission', 'in', v_commission, 'USDC', 'completed',
            'Commissione rete L' || v_level || ' ' || v_pct || '% da ' || COALESCE(v_earner_name,'downline')
              || ' (' || p_source_label || ': ' || p_earn_amount || ' USDC)',
            p_ref_id, p_ref_type, COALESCE(v_bal,0) + v_commission, p_accrual_date, 'network'
          );
          INSERT INTO public.income_records (user_id, amount, type)
          VALUES (v_sponsor_user, v_commission, 'network_commission');
          v_total := v_total + v_commission;
        END IF;
      END IF;
    END IF;
    v_current_profile := v_sponsor_next;
  END LOOP;
  RETURN v_total;
END; $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='process_daily_returns') THEN
    EXECUTE 'ALTER FUNCTION public.process_daily_returns() RENAME TO process_daily_returns_v1_deprecated';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.process_daily_returns()
RETURNS TABLE(processed integer, completed integer, skipped integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row record; v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_proc int := 0; v_comp int := 0; v_skip int := 0;
BEGIN
  PERFORM public.refresh_fund_statuses();
  FOR v_row IN SELECT id FROM public.investments WHERE status='active' ORDER BY COALESCE(last_payout_at, created_at)
  LOOP
    BEGIN
      DECLARE
        i public.investments%ROWTYPE; v_rate numeric; v_daily numeric;
        v_balance numeric; v_new_days int; v_completing boolean; v_principal numeric;
      BEGIN
        SELECT * INTO i FROM public.investments WHERE id = v_row.id FOR UPDATE;
        IF i.status <> 'active' THEN v_skip := v_skip+1; CONTINUE; END IF;
        v_rate := COALESCE(i.locked_daily_rate, i.daily_rate);
        IF v_rate IS NULL OR v_rate <= 0 THEN v_skip := v_skip+1; CONTINUE; END IF;
        IF EXISTS (SELECT 1 FROM public.wallet_transactions
          WHERE reference_id = i.id AND reference_type='investment' AND type='interest' AND accrual_date = v_today
        ) THEN v_skip := v_skip + 1; CONTINUE; END IF;
        v_daily := round((i.amount * v_rate / 100)::numeric, 6);
        v_new_days := GREATEST(0, COALESCE(i.days_remaining,0) - 1);
        v_completing := v_new_days <= 0;
        v_principal := CASE WHEN v_completing THEN i.amount ELSE 0 END;
        SELECT balance INTO v_balance FROM public.profiles WHERE user_id = i.user_id FOR UPDATE;
        IF v_balance IS NULL THEN v_skip := v_skip+1; CONTINUE; END IF;
        INSERT INTO public.wallet_transactions (
          user_id, type, direction, amount, asset, status, description,
          reference_id, reference_type, balance_after, accrual_date, source_balance
        ) VALUES (
          i.user_id, 'interest', 'in', v_daily, 'USDC', 'completed',
          'Interesse giornaliero ' || i.plan_name || ' (' || v_rate || '%)',
          i.id, 'investment', v_balance + v_daily, v_today, 'available'
        );
        UPDATE public.profiles SET
          balance = balance + v_daily,
          balance_available = balance_available + v_daily + v_principal,
          balance_locked = GREATEST(0, balance_locked - v_principal),
          total_earned = COALESCE(total_earned,0) + v_daily,
          updated_at = now()
        WHERE user_id = i.user_id;
        UPDATE public.investments SET
          earned = COALESCE(earned,0) + v_daily,
          days_remaining = v_new_days,
          status = CASE WHEN v_completing THEN 'completed' ELSE 'active' END,
          last_payout_at = now(), updated_at = now()
        WHERE id = i.id;
        IF v_completing THEN
          INSERT INTO public.wallet_transactions (
            user_id, type, direction, amount, asset, status, description,
            reference_id, reference_type, balance_after, accrual_date, source_balance
          ) VALUES (
            i.user_id, 'investment_unlock', 'internal', v_principal, 'USDC', 'completed',
            'Sblocco capitale ' || i.plan_name, i.id, 'investment', v_balance + v_daily, v_today, 'available'
          );
          v_comp := v_comp + 1;
        END IF;
        INSERT INTO public.income_records (user_id, amount, type) VALUES (i.user_id, v_daily, 'interest');
        IF i.migration_start_at IS NULL OR now() >= i.migration_start_at THEN
          PERFORM public.distribute_network_commissions(i.user_id, v_daily, i.plan_name, i.id, 'investment', v_today);
        END IF;
        v_proc := v_proc + 1;
      END;
    EXCEPTION
      WHEN unique_violation THEN v_skip := v_skip + 1;
      WHEN OTHERS THEN v_skip := v_skip + 1;
    END;
  END LOOP;

  FOR v_row IN SELECT id FROM public.fund_investments WHERE status='active' AND daily_rate IS NOT NULL
  LOOP
    BEGIN
      DECLARE
        f public.fund_investments%ROWTYPE; v_daily numeric; v_balance numeric;
        v_new_days int; v_completing boolean; v_principal numeric;
      BEGIN
        SELECT * INTO f FROM public.fund_investments WHERE id = v_row.id FOR UPDATE;
        IF f.status <> 'active' THEN v_skip := v_skip+1; CONTINUE; END IF;
        IF EXISTS (SELECT 1 FROM public.wallet_transactions
          WHERE reference_id = f.id AND reference_type='fund_investment' AND type='fund_interest' AND accrual_date = v_today
        ) THEN v_skip := v_skip+1; CONTINUE; END IF;
        v_daily := round((f.amount * f.daily_rate / 100)::numeric, 6);
        v_new_days := GREATEST(0, COALESCE(f.days_remaining,0) - 1);
        v_completing := v_new_days <= 0;
        v_principal := CASE WHEN v_completing THEN f.amount ELSE 0 END;
        SELECT balance INTO v_balance FROM public.profiles WHERE user_id = f.user_id FOR UPDATE;
        IF v_balance IS NULL THEN v_skip := v_skip+1; CONTINUE; END IF;
        INSERT INTO public.wallet_transactions (
          user_id, type, direction, amount, asset, status, description,
          reference_id, reference_type, balance_after, accrual_date, source_balance
        ) VALUES (
          f.user_id, 'fund_interest', 'in', v_daily, 'USDC', 'completed',
          'Interesse fondo speciale (' || f.daily_rate || '%)',
          f.id, 'fund_investment', v_balance + v_daily, v_today, 'available'
        );
        UPDATE public.profiles SET
          balance = balance + v_daily,
          balance_available = balance_available + v_daily + v_principal,
          balance_locked = GREATEST(0, balance_locked - v_principal),
          total_earned = COALESCE(total_earned,0) + v_daily,
          updated_at = now()
        WHERE user_id = f.user_id;
        UPDATE public.fund_investments SET
          total_earned = COALESCE(total_earned,0) + v_daily,
          days_remaining = v_new_days,
          status = CASE WHEN v_completing THEN 'completed' ELSE 'active' END,
          last_payout_at = now(), updated_at = now()
        WHERE id = f.id;
        IF v_completing THEN v_comp := v_comp + 1; END IF;
        INSERT INTO public.income_records (user_id, amount, type) VALUES (f.user_id, v_daily, 'fund_interest');
        PERFORM public.distribute_network_commissions(f.user_id, v_daily, 'Fondo speciale', f.id, 'fund_investment', v_today);
        v_proc := v_proc + 1;
      END;
    EXCEPTION
      WHEN unique_violation THEN v_skip := v_skip + 1;
      WHEN OTHERS THEN v_skip := v_skip + 1;
    END;
  END LOOP;
  RETURN QUERY SELECT v_proc, v_comp, v_skip;
END; $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='process_daily_returns_v1_deprecated') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.process_daily_returns_v1_deprecated() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.process_daily_returns_v1_deprecated() FROM anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.process_daily_returns_v1_deprecated() TO service_role';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.reinvest_from_balance(
  p_plan_id uuid, p_amount numeric, p_source text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid(); v_plan public.investment_plans%ROWTYPE;
  v_min numeric; v_available numeric; v_network numeric; v_suspended boolean;
  v_investment_id uuid; v_source_amount numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_source NOT IN ('available','network') THEN RAISE EXCEPTION 'Fonte non valida'; END IF;
  SELECT COALESCE(NULLIF(value,'')::numeric, 50) INTO v_min FROM public.admin_settings WHERE key = 'reinvest_min_amount';
  v_min := COALESCE(v_min, 50);
  IF p_amount IS NULL OR p_amount < v_min THEN RAISE EXCEPTION 'Importo minimo reinvestimento: % USDC', v_min; END IF;
  SELECT is_suspended, balance_available, network_balance INTO v_suspended, v_available, v_network
  FROM public.profiles WHERE user_id = v_uid FOR UPDATE;
  IF v_available IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF COALESCE(v_suspended,false) THEN RAISE EXCEPTION 'Account sospeso'; END IF;
  SELECT * INTO v_plan FROM public.investment_plans WHERE id = p_plan_id FOR UPDATE;
  IF NOT FOUND OR v_plan.status <> 'active' OR v_plan.is_legacy THEN RAISE EXCEPTION 'Piano non disponibile'; END IF;
  IF v_plan.min_invest IS NOT NULL AND p_amount < v_plan.min_invest THEN RAISE EXCEPTION 'Minimo per % è % USDC', v_plan.name, v_plan.min_invest; END IF;
  IF v_plan.max_invest IS NOT NULL AND p_amount > v_plan.max_invest THEN RAISE EXCEPTION 'Massimo per % è % USDC', v_plan.name, v_plan.max_invest; END IF;
  v_source_amount := CASE p_source WHEN 'available' THEN v_available ELSE v_network END;
  IF p_amount > COALESCE(v_source_amount, 0) THEN RAISE EXCEPTION 'Saldo % insufficiente: % USDC', p_source, v_source_amount; END IF;
  IF p_source = 'available' THEN
    UPDATE public.profiles SET balance_available = balance_available - p_amount, balance_locked = balance_locked + p_amount, updated_at = now() WHERE user_id = v_uid;
  ELSE
    UPDATE public.profiles SET network_balance = network_balance - p_amount, balance_locked = balance_locked + p_amount, balance = balance + p_amount, updated_at = now() WHERE user_id = v_uid;
  END IF;
  INSERT INTO public.investments (
    user_id, plan_id, plan_name, amount, days_remaining, status,
    last_payout_at, duration_days, daily_rate, locked_daily_rate, migration_start_at
  ) VALUES (
    v_uid, v_plan.id, v_plan.name, p_amount, COALESCE(v_plan.duration_days, v_plan.duration, 90),
    'active', now(), COALESCE(v_plan.duration_days, v_plan.duration, 90),
    v_plan.daily_return, v_plan.daily_return, now()
  ) RETURNING id INTO v_investment_id;
  UPDATE public.investment_plans SET pool_filled = COALESCE(pool_filled,0) + p_amount WHERE id = v_plan.id;
  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status, description,
    reference_id, reference_type, balance_after, source_balance
  ) VALUES (
    v_uid, 'reinvestment', 'internal', p_amount, 'USDC', 'completed',
    'Reinvestimento da ' || p_source || ' in ' || v_plan.name || ' (' || p_amount || ' USDC, 90gg @ ' || v_plan.daily_return || '%/gg)',
    v_investment_id, 'investment', (SELECT balance FROM public.profiles WHERE user_id = v_uid), p_source
  );
  RETURN v_investment_id;
END; $$;
REVOKE ALL ON FUNCTION public.reinvest_from_balance(uuid,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reinvest_from_balance(uuid,numeric,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_withdrawal(
  p_amount numeric, p_wallet_address text, p_type text, p_source text DEFAULT 'available'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric; v_available numeric; v_network numeric;
  v_source_amount numeric; v_min numeric;
  v_cfg jsonb; v_fee_pct numeric; v_fee numeric; v_net numeric;
  v_wid uuid; v_type_valid boolean; v_suspended boolean; v_addr text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_source NOT IN ('available','network') THEN RAISE EXCEPTION 'Fonte non valida'; END IF;
  SELECT is_suspended, balance, balance_available, network_balance INTO v_suspended, v_balance, v_available, v_network
  FROM public.profiles WHERE user_id = v_user_id FOR UPDATE;
  IF v_available IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF COALESCE(v_suspended, false) THEN RAISE EXCEPTION 'Account sospeso'; END IF;
  SELECT COALESCE(NULLIF(value,'')::numeric, 50) INTO v_min FROM public.admin_settings WHERE key = 'withdraw_min_amount';
  v_min := COALESCE(v_min, 50);
  IF p_amount IS NULL OR p_amount < v_min THEN RAISE EXCEPTION 'Importo minimo prelievo: % USDC', v_min; END IF;
  IF p_wallet_address IS NULL THEN RAISE EXCEPTION 'Indirizzo wallet non valido'; END IF;
  v_addr := trim(p_wallet_address);
  IF p_type NOT IN ('fast','medium','slow') THEN RAISE EXCEPTION 'Tipo di prelievo non valido'; END IF;
  IF NOT (v_addr ~ '^T[1-9A-HJ-NP-Za-km-z]{33}$' OR v_addr ~ '^0x[a-fA-F0-9]{40}$') THEN
    RAISE EXCEPTION 'Indirizzo wallet non valido (TRC-20 o ERC-20)';
  END IF;
  SELECT value::jsonb INTO v_cfg FROM public.admin_settings WHERE key = 'withdrawal_config';
  IF v_cfg IS NULL THEN
    v_fee_pct := CASE p_type WHEN 'fast' THEN 20 WHEN 'slow' THEN 5 ELSE 10 END;
    v_type_valid := true;
  ELSE
    SELECT (elem->>'fee_pct')::numeric, true INTO v_fee_pct, v_type_valid
    FROM jsonb_array_elements(v_cfg) elem
    WHERE elem->>'key' = p_type AND COALESCE((elem->>'active')::boolean, true) LIMIT 1;
  END IF;
  IF NOT COALESCE(v_type_valid,false) OR v_fee_pct IS NULL THEN RAISE EXCEPTION 'Tipo di prelievo non valido'; END IF;
  v_source_amount := CASE p_source WHEN 'available' THEN v_available ELSE v_network END;
  IF p_amount > COALESCE(v_source_amount, 0) THEN RAISE EXCEPTION 'Saldo % insufficiente: % USDC', p_source, v_source_amount; END IF;
  v_fee := round((p_amount * v_fee_pct / 100)::numeric, 2);
  v_net := p_amount - v_fee;
  IF p_source = 'available' THEN
    UPDATE public.profiles SET balance = balance - p_amount, balance_available = balance_available - p_amount, updated_at = now() WHERE user_id = v_user_id;
  ELSE
    UPDATE public.profiles SET network_balance = network_balance - p_amount, updated_at = now() WHERE user_id = v_user_id;
  END IF;
  INSERT INTO public.withdrawals (user_id, amount, fee, net, wallet_address, type, status, source_balance)
  VALUES (v_user_id, p_amount, v_fee, v_net, v_addr, p_type, 'pending', p_source)
  RETURNING id INTO v_wid;
  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status, description,
    reference_id, reference_type, balance_after, source_balance
  ) VALUES (
    v_user_id, 'withdrawal', 'out', p_amount, 'USDC', 'pending',
    'Richiesta prelievo da ' || p_source || ' ' || p_amount || ' USDC (fee ' || v_fee || ')',
    v_wid, 'withdrawal',
    CASE WHEN p_source='available' THEN v_balance - p_amount ELSE v_balance END, p_source
  );
  RETURN v_wid;
END; $$;
REVOKE ALL ON FUNCTION public.create_withdrawal(numeric,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_withdrawal(numeric,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_investment(p_user_id uuid, p_plan_id uuid, p_plan_name text, p_amount numeric, p_duration integer)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
DECLARE
  v_available numeric; v_plan public.investment_plans%ROWTYPE;
  v_daily_rate numeric; v_duration integer; v_investment_id uuid;
  v_uid uuid := auth.uid(); v_suspended boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_user_id IS NULL OR p_user_id <> v_uid THEN RAISE EXCEPTION 'Access denied'; END IF;
  SELECT is_suspended INTO v_suspended FROM public.profiles WHERE user_id = v_uid;
  IF COALESCE(v_suspended, false) THEN RAISE EXCEPTION 'Account sospeso'; END IF;
  SELECT * INTO v_plan FROM public.investment_plans WHERE id = p_plan_id FOR UPDATE;
  IF NOT FOUND OR v_plan.status <> 'active' OR v_plan.is_legacy THEN RAISE EXCEPTION 'Piano non disponibile'; END IF;
  v_duration := COALESCE(v_plan.duration_days, v_plan.duration, p_duration);
  v_daily_rate := v_plan.daily_return;
  IF v_daily_rate IS NULL OR v_daily_rate <= 0 THEN RAISE EXCEPTION 'Piano senza rendimento'; END IF;
  IF v_duration IS NULL OR v_duration <= 0 THEN RAISE EXCEPTION 'Durata piano non valida'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Importo non valido'; END IF;
  IF v_plan.min_invest IS NOT NULL AND p_amount < v_plan.min_invest THEN RAISE EXCEPTION 'Minimo per % è % USDC', v_plan.name, v_plan.min_invest; END IF;
  IF v_plan.max_invest IS NOT NULL AND p_amount > v_plan.max_invest THEN RAISE EXCEPTION 'Massimo per % è % USDC', v_plan.name, v_plan.max_invest; END IF;
  IF v_plan.pool_total IS NOT NULL AND v_plan.pool_total > 0 AND COALESCE(v_plan.pool_filled,0) + p_amount > v_plan.pool_total THEN RAISE EXCEPTION 'Pool esaurito'; END IF;
  SELECT balance_available INTO v_available FROM public.profiles WHERE user_id = v_uid FOR UPDATE;
  IF p_amount > COALESCE(v_available,0) THEN RAISE EXCEPTION 'Saldo insufficiente: % USDC', v_available; END IF;
  UPDATE public.profiles SET balance_available = balance_available - p_amount, balance_locked = balance_locked + p_amount, updated_at = now() WHERE user_id = v_uid;
  INSERT INTO public.investments (
    user_id, plan_id, plan_name, amount, days_remaining, status,
    last_payout_at, duration_days, daily_rate, locked_daily_rate, migration_start_at
  ) VALUES (
    v_uid, p_plan_id, v_plan.name, p_amount, v_duration, 'active',
    now(), v_duration, v_daily_rate, v_daily_rate, now()
  ) RETURNING id INTO v_investment_id;
  UPDATE public.investment_plans SET pool_filled = COALESCE(pool_filled,0) + p_amount WHERE id = p_plan_id;
  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status, description,
    reference_id, reference_type, balance_after, source_balance
  ) VALUES (
    v_uid, 'investment_lock', 'internal', p_amount, 'USDC', 'completed',
    'Capitale bloccato in ' || v_plan.name || ' (' || p_amount || ' USDC, ' || v_duration || 'gg @ ' || v_daily_rate || '%/gg)',
    v_investment_id, 'investment', (SELECT balance FROM public.profiles WHERE user_id = v_uid), 'available'
  );
  RETURN v_investment_id;
END; $function$;
