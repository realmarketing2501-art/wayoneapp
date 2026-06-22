
-- 1) Configurable commission percentage
INSERT INTO public.admin_settings (key, value, description)
VALUES ('referral_commission_pct', '1.5', 'Percentuale commissione referral pagata al diretto L1 sui guadagni del referral')
ON CONFLICT (key) DO NOTHING;

-- 2) Disable level-bonus trigger (no more one-time qualification bonuses)
DROP TRIGGER IF EXISTS trg_award_level_bonus_on_change ON public.profiles;

-- 3) Helper: pay 1.5% commission to direct L1 referrer
CREATE OR REPLACE FUNCTION public.pay_referral_commission(
  p_earner_user_id uuid,
  p_earn_amount numeric,
  p_source_label text,
  p_ref_id uuid,
  p_ref_type text
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_profile uuid;
  v_referrer_user uuid;
  v_pct numeric;
  v_commission numeric;
  v_balance numeric;
  v_earner_name text;
BEGIN
  IF p_earn_amount IS NULL OR p_earn_amount <= 0 THEN RETURN 0; END IF;

  -- Direct L1 only
  SELECT referred_by, username INTO v_referrer_profile, v_earner_name
  FROM public.profiles WHERE user_id = p_earner_user_id;
  IF v_referrer_profile IS NULL THEN RETURN 0; END IF;

  SELECT user_id INTO v_referrer_user
  FROM public.profiles WHERE id = v_referrer_profile;
  IF v_referrer_user IS NULL THEN RETURN 0; END IF;

  -- Read configurable rate (default 1.5)
  SELECT COALESCE(NULLIF(value,'')::numeric, 1.5) INTO v_pct
  FROM public.admin_settings WHERE key = 'referral_commission_pct';
  v_pct := COALESCE(v_pct, 1.5);
  IF v_pct <= 0 THEN RETURN 0; END IF;

  v_commission := round((p_earn_amount * v_pct / 100)::numeric, 6);
  IF v_commission <= 0 THEN RETURN 0; END IF;

  SELECT balance INTO v_balance FROM public.profiles
  WHERE user_id = v_referrer_user FOR UPDATE;
  IF v_balance IS NULL THEN RETURN 0; END IF;

  UPDATE public.profiles SET
    balance = balance + v_commission,
    balance_available = balance_available + v_commission,
    total_earned = total_earned + v_commission,
    updated_at = now()
  WHERE user_id = v_referrer_user;

  INSERT INTO public.wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_id, reference_type, balance_after
  ) VALUES (
    v_referrer_user, 'referral_commission', 'in', v_commission, 'USDT', 'completed',
    'Commissione referral ' || v_pct || '% da ' || COALESCE(v_earner_name,'diretto') ||
      ' (' || p_source_label || ': ' || p_earn_amount || ' USDT)',
    p_ref_id, p_ref_type, v_balance + v_commission
  );

  INSERT INTO public.income_records (user_id, amount, type)
  VALUES (v_referrer_user, v_commission, 'referral_commission');

  RETURN v_commission;
END;
$$;

-- 4) Replace process_daily_returns: same logic + commission payout on each interest accrual
CREATE OR REPLACE FUNCTION public.process_daily_returns()
RETURNS TABLE(processed integer, completed integer, skipped integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_balance numeric; v_available numeric; v_locked numeric; v_earned_tot numeric;
  v_rate numeric; v_daily numeric;
  v_new_days int; v_completing boolean; v_principal numeric;
  v_proc int := 0; v_comp int := 0; v_skip int := 0;
BEGIN
  PERFORM public.refresh_fund_statuses();

  -- Investments
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

      -- Pay 1.5% referral commission to direct L1
      PERFORM public.pay_referral_commission(i.user_id, v_daily, i.plan_name, i.id, 'investment');

      v_proc := v_proc + 1;
    END;
  END LOOP;

  -- Fund investments
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

      -- Pay 1.5% referral commission to direct L1
      PERFORM public.pay_referral_commission(f.user_id, v_daily, 'fondo ' || COALESCE(v_fund_name,''), f.id, 'fund_investment');

      v_proc := v_proc + 1;
    END;
  END LOOP;

  PERFORM public.refresh_fund_statuses();

  processed := v_proc; completed := v_comp; skipped := v_skip;
  RETURN NEXT;
END;
$$;
