CREATE OR REPLACE FUNCTION public.pay_referral_commission(p_earner_user_id uuid, p_earn_amount numeric, p_source_label text, p_ref_id uuid, p_ref_type text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referrer_profile uuid;
  v_referrer_user uuid;
  v_referrer_level public.level_name;
  v_pct numeric;
  v_commission numeric;
  v_balance numeric;
  v_earner_name text;
BEGIN
  IF p_earn_amount IS NULL OR p_earn_amount <= 0 THEN RETURN 0; END IF;

  SELECT referred_by, username INTO v_referrer_profile, v_earner_name
  FROM public.profiles WHERE user_id = p_earner_user_id;
  IF v_referrer_profile IS NULL THEN RETURN 0; END IF;

  SELECT user_id, level INTO v_referrer_user, v_referrer_level
  FROM public.profiles WHERE id = v_referrer_profile;
  IF v_referrer_user IS NULL THEN RETURN 0; END IF;

  -- % dal livello del referente
  SELECT bonus_percentuale INTO v_pct FROM public.levels WHERE id = v_referrer_level::text;
  -- fallback su admin_settings se non trovato
  IF v_pct IS NULL THEN
    SELECT COALESCE(NULLIF(value,'')::numeric, 5) INTO v_pct
    FROM public.admin_settings WHERE key = 'referral_commission_pct';
    v_pct := COALESCE(v_pct, 5);
  END IF;
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
    'Commissione referral ' || v_pct || '% (livello ' || v_referrer_level::text || ') da ' || COALESCE(v_earner_name,'diretto') ||
      ' (' || p_source_label || ': ' || p_earn_amount || ' USDT)',
    p_ref_id, p_ref_type, v_balance + v_commission
  );

  INSERT INTO public.income_records (user_id, amount, type)
  VALUES (v_referrer_user, v_commission, 'referral_commission');

  RETURN v_commission;
END;
$function$;