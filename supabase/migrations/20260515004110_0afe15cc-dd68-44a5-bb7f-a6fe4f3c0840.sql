
-- Seed/aggiorna 5 piani fissi (mantengo gli id esistenti per non rompere riferimenti)
UPDATE public.investment_plans
SET name='Silver', duration=45, duration_days=45, daily_return=0.50,
    min_invest=50, max_invest=2000, min_level='gamma', status='active'
WHERE id='11111111-1111-1111-1111-111111111111';

UPDATE public.investment_plans
SET name='Diamond', duration=90, duration_days=90, daily_return=0.90,
    min_invest=50, max_invest=1000000, min_level='gamma', status='active'
WHERE id='22222222-2222-2222-2222-222222222222';

INSERT INTO public.investment_plans (id, name, duration, duration_days, daily_return, min_invest, max_invest, min_level, status, pool_total, pool_filled)
VALUES
  ('33333333-3333-3333-3333-333333333333','Starter',30,30,0.40,50,500,'gamma','active',0,0),
  ('44444444-4444-4444-4444-444444444444','Gold',60,60,0.60,50,5000,'gamma','active',0,0),
  ('55555555-5555-5555-5555-555555555555','Platinum',75,75,0.75,50,10000,'gamma','active',0,0)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, duration=EXCLUDED.duration, duration_days=EXCLUDED.duration_days,
  daily_return=EXCLUDED.daily_return, min_invest=EXCLUDED.min_invest, max_invest=EXCLUDED.max_invest,
  min_level=EXCLUDED.min_level, status=EXCLUDED.status;

-- Rewrite create_investment: accetta qualsiasi durata e usa daily_return del piano
CREATE OR REPLACE FUNCTION public.create_investment(p_user_id uuid, p_plan_id uuid, p_plan_name text, p_amount numeric, p_duration integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
  v_plan public.investment_plans%ROWTYPE;
  v_daily_rate numeric;
  v_duration integer;
  v_investment_id uuid;
BEGIN
  SELECT * INTO v_plan FROM public.investment_plans WHERE id = p_plan_id;
  IF NOT FOUND OR v_plan.status <> 'active' THEN
    RAISE EXCEPTION 'Piano non valido o non attivo';
  END IF;

  v_duration := COALESCE(v_plan.duration_days, v_plan.duration, p_duration);
  v_daily_rate := v_plan.daily_return;

  IF v_daily_rate IS NULL OR v_daily_rate <= 0 THEN
    RAISE EXCEPTION 'Piano senza rendimento giornaliero configurato';
  END IF;
  IF v_duration IS NULL OR v_duration <= 0 THEN
    RAISE EXCEPTION 'Durata del piano non valida';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Importo non valido';
  END IF;
  IF v_plan.min_invest IS NOT NULL AND p_amount < v_plan.min_invest THEN
    RAISE EXCEPTION 'Importo minimo per % è % USDT', v_plan.name, v_plan.min_invest;
  END IF;
  IF v_plan.max_invest IS NOT NULL AND p_amount > v_plan.max_invest THEN
    RAISE EXCEPTION 'Importo massimo per % è % USDT', v_plan.name, v_plan.max_invest;
  END IF;

  SELECT balance_available INTO v_balance
  FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profilo non trovato'; END IF;
  IF p_amount > v_balance THEN
    RAISE EXCEPTION 'Saldo insufficiente: hai % USDT disponibili', v_balance;
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
    p_user_id, p_plan_id, v_plan.name, p_amount, v_duration, 'active',
    now(), v_duration, v_daily_rate
  )
  RETURNING id INTO v_investment_id;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  )
  VALUES (
    p_user_id, 'investment', 'out', p_amount, 'USDT', 'completed',
    'Investimento ' || v_plan.name || ' - ' || p_amount || ' USDT (' || v_duration || 'gg @ ' || v_daily_rate || '%/gg)',
    v_investment_id, 'investment',
    v_balance - p_amount
  );

  RETURN v_investment_id;
END;
$$;
