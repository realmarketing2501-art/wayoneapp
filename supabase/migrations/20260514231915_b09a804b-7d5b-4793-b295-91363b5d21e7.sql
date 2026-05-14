CREATE OR REPLACE FUNCTION public.create_investment(p_user_id uuid, p_plan_id uuid, p_plan_name text, p_amount numeric, p_duration integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
  v_user_level public.level_name;
  v_level_row public.levels%ROWTYPE;
  v_level_label text;
  v_daily_rate numeric;
  v_investment_id uuid;
BEGIN
  IF p_duration NOT IN (45, 90) THEN
    RAISE EXCEPTION 'Durata non valida: deve essere 45 o 90 giorni';
  END IF;

  SELECT balance_available, level INTO v_balance, v_user_level
  FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Profilo non trovato';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Importo non valido';
  END IF;

  IF p_amount > v_balance THEN
    RAISE EXCEPTION 'Saldo insufficiente: hai % USDT disponibili', v_balance;
  END IF;

  SELECT * INTO v_level_row FROM public.levels WHERE id = v_user_level::text;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configurazione livello non trovata';
  END IF;

  v_level_label := COALESCE(v_level_row.name, v_user_level::text);

  -- Validations entry-level (gamma/beta) usando il nome visuale aggiornato
  IF v_user_level = 'gamma' THEN
    IF p_duration <> 45 THEN
      RAISE EXCEPTION 'Il livello % può investire solo nel piano a 45 giorni', v_level_label;
    END IF;
    IF p_amount < COALESCE(v_level_row.investimento_min, 50) OR p_amount > COALESCE(v_level_row.investimento_max, 100) THEN
      RAISE EXCEPTION 'Per il livello % l''investimento deve essere compreso tra % e % USDT',
        v_level_label, v_level_row.investimento_min, v_level_row.investimento_max;
    END IF;
  END IF;

  IF v_user_level = 'beta' THEN
    IF p_duration <> 45 THEN
      RAISE EXCEPTION 'Il livello % può investire solo nel piano a 45 giorni', v_level_label;
    END IF;
    IF p_amount > COALESCE(v_level_row.investimento_max, 100) THEN
      RAISE EXCEPTION 'Per il livello % l''investimento massimo è % USDT',
        v_level_label, v_level_row.investimento_max;
    END IF;
  END IF;

  IF p_duration = 45 THEN
    v_daily_rate := v_level_row.giornaliero_45;
  ELSE
    v_daily_rate := v_level_row.giornaliero_90;
  END IF;

  IF v_daily_rate IS NULL THEN
    RAISE EXCEPTION 'Il livello % non prevede il piano a % giorni', v_level_label, p_duration;
  END IF;

  UPDATE public.profiles SET
    balance = balance - p_amount,
    balance_available = balance_available - p_amount,
    balance_locked = balance_locked + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.investments (
    user_id, plan_id, plan_name, amount, days_remaining, status,
    last_payout_at, duration_days, daily_rate
  )
  VALUES (
    p_user_id, p_plan_id, p_plan_name, p_amount, p_duration, 'active',
    now(), p_duration, v_daily_rate
  )
  RETURNING id INTO v_investment_id;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  )
  VALUES (
    p_user_id, 'investment', 'out', p_amount, 'USDT', 'completed',
    'Investimento ' || p_plan_name || ' - ' || p_amount || ' USDT (' || p_duration || 'gg @ ' || v_daily_rate || '%/gg)',
    v_investment_id, 'investment',
    v_balance - p_amount
  );

  RETURN v_investment_id;
END;
$function$;

-- award_level_bonus: usa il nome visuale dalla tabella levels nella descrizione del ledger
CREATE OR REPLACE FUNCTION public.award_level_bonus(p_user_id uuid, p_level level_name)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bonus numeric;
  v_balance numeric;
  v_already_paid boolean;
  v_level_label text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM level_bonus_payouts WHERE user_id = p_user_id AND level = p_level
  ) INTO v_already_paid;
  IF v_already_paid THEN RETURN false; END IF;

  SELECT bonus_valore, name INTO v_bonus, v_level_label FROM levels WHERE id = p_level::text;
  IF v_bonus IS NULL OR v_bonus <= 0 THEN RETURN false; END IF;

  v_level_label := COALESCE(v_level_label, p_level::text);

  SELECT balance INTO v_balance FROM profiles WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RETURN false; END IF;

  UPDATE profiles SET
    balance = balance + v_bonus,
    balance_available = balance_available + v_bonus,
    total_earned = total_earned + v_bonus,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO level_bonus_payouts (user_id, level, amount)
  VALUES (p_user_id, p_level, v_bonus);

  INSERT INTO wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_type, balance_after
  ) VALUES (
    p_user_id, 'bonus', 'in', v_bonus, 'USDT', 'completed',
    'Bonus rete una-tantum livello ' || v_level_label || ' (+' || v_bonus || ' USDT)',
    'level_bonus', v_balance + v_bonus
  );

  INSERT INTO income_records (user_id, amount, type)
  VALUES (p_user_id, v_bonus, 'level_bonus');

  RETURN true;
END;
$function$;