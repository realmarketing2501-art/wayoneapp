-- 1. Add new enum values for the 2 missing levels
ALTER TYPE public.level_name ADD VALUE IF NOT EXISTS 'gold_elite';
ALTER TYPE public.level_name ADD VALUE IF NOT EXISTS 'oro_vip';

-- 2. Add per-level plan columns: duration in days + weekly %
ALTER TABLE public.levels
  ADD COLUMN IF NOT EXISTS durata_giorni integer,
  ADD COLUMN IF NOT EXISTS settimanale numeric;

-- 3. Idempotency table: each (user, level) bonus paid only once
CREATE TABLE IF NOT EXISTS public.level_bonus_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  level public.level_name NOT NULL,
  amount numeric NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);

ALTER TABLE public.level_bonus_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own level bonus payouts"
ON public.level_bonus_payouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all level bonus payouts"
ON public.level_bonus_payouts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Function: pay one-time network bonus when user reaches a new level
CREATE OR REPLACE FUNCTION public.award_level_bonus(p_user_id uuid, p_level public.level_name)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bonus numeric;
  v_balance numeric;
  v_already_paid boolean;
BEGIN
  -- Already paid?
  SELECT EXISTS (
    SELECT 1 FROM level_bonus_payouts WHERE user_id = p_user_id AND level = p_level
  ) INTO v_already_paid;
  IF v_already_paid THEN RETURN false; END IF;

  SELECT bonus_valore INTO v_bonus FROM levels WHERE id = p_level::text;
  IF v_bonus IS NULL OR v_bonus <= 0 THEN RETURN false; END IF;

  -- Lock profile, credit balance
  SELECT balance INTO v_balance FROM profiles WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN RETURN false; END IF;

  UPDATE profiles SET
    balance = balance + v_bonus,
    balance_available = balance_available + v_bonus,
    total_earned = total_earned + v_bonus,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Idempotency record
  INSERT INTO level_bonus_payouts (user_id, level, amount)
  VALUES (p_user_id, p_level, v_bonus);

  -- Ledger
  INSERT INTO wallet_transactions (
    user_id, type, direction, amount, asset, status,
    description, reference_type, balance_after
  ) VALUES (
    p_user_id, 'bonus', 'in', v_bonus, 'USDT', 'completed',
    'Bonus rete una-tantum livello ' || p_level::text || ' (+' || v_bonus || ' USDT)',
    'level_bonus', v_balance + v_bonus
  );

  -- Income record
  INSERT INTO income_records (user_id, amount, type)
  VALUES (p_user_id, v_bonus, 'level_bonus');

  RETURN true;
END;
$$;

-- 5. Trigger on profiles: when level changes, try to award bonus
CREATE OR REPLACE FUNCTION public.trg_award_level_bonus_on_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.level IS DISTINCT FROM OLD.level THEN
    PERFORM public.award_level_bonus(NEW.user_id, NEW.level);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_award_level_bonus ON public.profiles;
CREATE TRIGGER trg_profiles_award_level_bonus
AFTER UPDATE OF level ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_award_level_bonus_on_change();

-- 6. Hook recompute_user_metrics so it actually fires the trigger when level changes
-- (existing function already updates profiles.level → trigger above will fire)

-- 7. Make sure existing investment trigger exists on investments table
DROP TRIGGER IF EXISTS trg_investments_recompute_upline ON public.investments;
CREATE TRIGGER trg_investments_recompute_upline
AFTER INSERT OR UPDATE OF status, amount OR DELETE ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_upline_on_investment();