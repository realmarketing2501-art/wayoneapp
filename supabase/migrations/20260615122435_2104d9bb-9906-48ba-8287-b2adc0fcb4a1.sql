
CREATE OR REPLACE FUNCTION public.refresh_fund_statuses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  UPDATE public.special_funds
  SET status = CASE
    WHEN close_date IS NOT NULL AND close_date < CURRENT_DATE THEN 'ended'
    WHEN goal > 0 AND raised >= goal THEN 'sold_out'
    WHEN open_date IS NOT NULL AND open_date > CURRENT_DATE THEN 'upcoming'
    ELSE 'issuing'
  END
  WHERE status <> CASE
    WHEN close_date IS NOT NULL AND close_date < CURRENT_DATE THEN 'ended'
    WHEN goal > 0 AND raised >= goal THEN 'sold_out'
    WHEN open_date IS NOT NULL AND open_date > CURRENT_DATE THEN 'upcoming'
    ELSE 'issuing'
  END;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.refresh_fund_statuses() FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.process_daily_returns()
 RETURNS TABLE(processed integer, completed integer, skipped integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row record;
  v_balance numeric; v_available numeric; v_locked numeric; v_earned_tot numeric;
  v_rate numeric; v_daily numeric;
  v_new_days int; v_completing boolean; v_principal numeric;
  v_proc int := 0; v_comp int := 0; v_skip int := 0;
BEGIN
  PERFORM public.refresh_fund_statuses();

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

  PERFORM public.refresh_fund_statuses();

  processed := v_proc; completed := v_comp; skipped := v_skip;
  RETURN NEXT;
END; $function$;

SELECT public.refresh_fund_statuses();
