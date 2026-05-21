
-- 1. Remove direct INSERT policies (users must use RPCs)
DROP POLICY IF EXISTS "Users can create own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can create own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can create own fund investments" ON public.fund_investments;
DROP POLICY IF EXISTS "Users can create own withdrawals" ON public.withdrawals;

-- 2. RPC for withdrawals with atomic balance check
CREATE OR REPLACE FUNCTION public.create_withdrawal(
  p_amount numeric,
  p_wallet_address text,
  p_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_cfg jsonb;
  v_fee_pct numeric;
  v_fee numeric;
  v_net numeric;
  v_wid uuid;
  v_type_valid boolean;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Importo non valido'; END IF;
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) < 10 THEN
    RAISE EXCEPTION 'Indirizzo wallet non valido';
  END IF;

  -- Resolve fee from withdrawal_config admin_setting
  SELECT value::jsonb INTO v_cfg FROM public.admin_settings WHERE key = 'withdrawal_config';
  IF v_cfg IS NULL THEN
    v_fee_pct := CASE p_type WHEN 'fast' THEN 20 WHEN 'slow' THEN 5 ELSE 10 END;
    v_type_valid := p_type IN ('fast','medium','slow');
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
  VALUES (v_user_id, p_amount, v_fee, v_net, p_wallet_address, p_type, 'pending')
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
$$;

REVOKE ALL ON FUNCTION public.create_withdrawal(numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_withdrawal(numeric, text, text) TO authenticated;

-- 3. Restrict profile UPDATE to non-sensitive fields for non-admins
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins and SECURITY DEFINER paths (no auth.uid) to do anything
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.balance_available IS DISTINCT FROM OLD.balance_available
     OR NEW.balance_locked IS DISTINCT FROM OLD.balance_locked
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.network_volume IS DISTINCT FROM OLD.network_volume
     OR NEW.total_earned IS DISTINCT FROM OLD.total_earned
     OR NEW.total_network IS DISTINCT FROM OLD.total_network
     OR NEW.production IS DISTINCT FROM OLD.production
     OR NEW.units IS DISTINCT FROM OLD.units
     OR NEW.direct_referrals IS DISTINCT FROM OLD.direct_referrals
     OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
     OR NEW.has_confirmed_deposit IS DISTINCT FROM OLD.has_confirmed_deposit
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Non puoi modificare campi protetti del profilo';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- 4. Restrict user_tasks to system/admin only writes
CREATE OR REPLACE FUNCTION public.protect_user_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Progressi attività gestiti dal sistema';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_tasks_ins ON public.user_tasks;
DROP TRIGGER IF EXISTS trg_protect_user_tasks_upd ON public.user_tasks;
CREATE TRIGGER trg_protect_user_tasks_ins
BEFORE INSERT ON public.user_tasks
FOR EACH ROW EXECUTE FUNCTION public.protect_user_tasks();
CREATE TRIGGER trg_protect_user_tasks_upd
BEFORE UPDATE ON public.user_tasks
FOR EACH ROW EXECUTE FUNCTION public.protect_user_tasks();
