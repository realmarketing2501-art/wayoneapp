-- ============================================================
-- WAY ONE QUALIFICHE - MIGRATION #1: SCHEMA + WIPE
-- ============================================================

-- Step 1: WIPE all non-admin user data
-- Identify admin user_ids to preserve
DO $$
DECLARE
  v_admin_ids uuid[];
BEGIN
  SELECT array_agg(user_id) INTO v_admin_ids
  FROM public.user_roles WHERE role = 'admin';

  IF v_admin_ids IS NULL THEN
    v_admin_ids := ARRAY[]::uuid[];
  END IF;

  -- Delete dependent data first
  DELETE FROM public.wallet_transactions WHERE user_id <> ALL(v_admin_ids);
  DELETE FROM public.income_records WHERE user_id <> ALL(v_admin_ids);
  DELETE FROM public.investments WHERE user_id <> ALL(v_admin_ids);
  DELETE FROM public.deposit_intents WHERE user_id <> ALL(v_admin_ids);
  DELETE FROM public.deposits WHERE user_id <> ALL(v_admin_ids);
  DELETE FROM public.withdrawals WHERE user_id <> ALL(v_admin_ids);
  DELETE FROM public.fund_investments WHERE user_id <> ALL(v_admin_ids);
  DELETE FROM public.user_tasks WHERE user_id <> ALL(v_admin_ids);
  DELETE FROM public.user_notifications WHERE user_id <> ALL(v_admin_ids);
  DELETE FROM public.wallets WHERE user_id <> ALL(v_admin_ids);

  -- Wipe entire detected_transactions (no user link)
  DELETE FROM public.detected_transactions;

  -- Reset admin profile referral counters (start clean)
  UPDATE public.profiles
  SET direct_referrals = 0, total_network = 0, network_volume = 0,
      referred_by = NULL, balance = 0, balance_available = 0, balance_locked = 0,
      total_earned = 0, has_confirmed_deposit = false
  WHERE user_id = ANY(v_admin_ids);

  -- Delete non-admin profiles
  DELETE FROM public.profiles WHERE user_id <> ALL(v_admin_ids);

  -- Delete non-admin auth users (cascade-like)
  DELETE FROM auth.users WHERE id <> ALL(v_admin_ids);
END $$;

-- Step 2: Drop dead table
DROP TABLE IF EXISTS public.network_tree CASCADE;

-- Step 3: Drop old RPC that references old enum
DROP FUNCTION IF EXISTS public.create_investment(uuid, uuid, text, numeric, integer);

-- Step 4: Drop dependencies on level_name enum, then recreate enum
ALTER TABLE public.profiles ALTER COLUMN level DROP DEFAULT;
ALTER TABLE public.investment_plans ALTER COLUMN min_level DROP DEFAULT;

-- Convert columns to text temporarily
ALTER TABLE public.profiles ALTER COLUMN level TYPE text USING level::text;
ALTER TABLE public.investment_plans ALTER COLUMN min_level TYPE text USING min_level::text;

-- Drop and recreate enum
DROP TYPE IF EXISTS public.level_name CASCADE;
CREATE TYPE public.level_name AS ENUM ('gamma', 'beta', 'bronze', 'silver', 'silver_elite', 'gold');

-- Step 5: Reset investment_plans (wipe + 2 fixed plans)
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS duration_days integer;
DELETE FROM public.investment_plans;
ALTER TABLE public.investment_plans ALTER COLUMN min_invest DROP NOT NULL;
ALTER TABLE public.investment_plans ALTER COLUMN max_invest DROP NOT NULL;
ALTER TABLE public.investment_plans ALTER COLUMN daily_return DROP NOT NULL;

INSERT INTO public.investment_plans (id, name, duration, duration_days, daily_return, min_invest, max_invest, pool_total, pool_filled, status, min_level)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Piano 45gg', 45, 45, 0, 50, 1000000, 10000000, 0, 'active', 'gamma'),
  ('22222222-2222-2222-2222-222222222222', 'Piano 90gg', 90, 90, 0, 50, 1000000, 10000000, 0, 'active', 'bronze');

-- Restore enum types and defaults
ALTER TABLE public.profiles ALTER COLUMN level TYPE public.level_name USING 'gamma'::public.level_name;
ALTER TABLE public.profiles ALTER COLUMN level SET DEFAULT 'gamma'::public.level_name;
ALTER TABLE public.investment_plans ALTER COLUMN min_level TYPE public.level_name USING min_level::public.level_name;
ALTER TABLE public.investment_plans ALTER COLUMN min_level SET DEFAULT 'gamma'::public.level_name;

-- Step 6: Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS units integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS production numeric NOT NULL DEFAULT 0;

-- Step 7: Add new columns to investments
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS daily_rate numeric;

-- Backfill existing investments (none should exist after wipe, but safe)
UPDATE public.investments SET duration_days = COALESCE(duration_days, 45), daily_rate = COALESCE(daily_rate, 1.0) WHERE duration_days IS NULL OR daily_rate IS NULL;

-- Step 8: Create levels configuration table (single source of truth)
CREATE TABLE IF NOT EXISTS public.levels (
  id text PRIMARY KEY,
  name text NOT NULL,
  ordine integer NOT NULL UNIQUE,
  unita_richieste integer,
  produzione_richiesta numeric,
  bonus_percentuale numeric NOT NULL DEFAULT 0,
  bonus_valore numeric NOT NULL DEFAULT 0,
  giornaliero_45 numeric,
  giornaliero_90 numeric,
  investimento_min numeric,
  investimento_max numeric,
  rete boolean NOT NULL DEFAULT false,
  note text,
  prossimo_livello text REFERENCES public.levels(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Levels readable by all authenticated" ON public.levels;
CREATE POLICY "Levels readable by all authenticated" ON public.levels FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Levels readable by anon" ON public.levels;
CREATE POLICY "Levels readable by anon" ON public.levels FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Admins can insert levels" ON public.levels;
CREATE POLICY "Admins can insert levels" ON public.levels FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update levels" ON public.levels;
CREATE POLICY "Admins can update levels" ON public.levels FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete levels" ON public.levels;
CREATE POLICY "Admins can delete levels" ON public.levels FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed: insert in order respecting FK on prossimo_livello (insert NULL first, then update)
INSERT INTO public.levels (id, name, ordine, unita_richieste, produzione_richiesta, bonus_percentuale, bonus_valore, giornaliero_45, giornaliero_90, investimento_min, investimento_max, rete, note, prossimo_livello) VALUES
  ('gold', 'Gold', 6, 1296, 129600, 25, 32400, 2.6, 3.6, NULL, NULL, true, 'Bonus accreditato entro 72 ore', NULL),
  ('silver_elite', 'Silver Elite', 5, 216, 21600, 20, 4320, 2.0, 2.6, NULL, NULL, true, 'Bonus accreditato entro 72 ore', 'gold'),
  ('silver', 'Silver Investitore', 4, 36, 3600, 15, 540, 1.6, 2.0, NULL, NULL, true, 'Serve per accedere al livello Silver Elite', 'silver_elite'),
  ('bronze', 'Bronze Investitore', 3, 6, 600, 10, 60, 1.0, 1.6, NULL, NULL, true, 'Serve per accedere al livello Silver', 'silver'),
  ('beta', 'Beta Investitore', 2, NULL, NULL, 0, 0, 0.8, NULL, NULL, 100, true, 'Può fare rete per diventare Bronze', 'bronze'),
  ('gamma', 'Gamma Investitore', 1, NULL, NULL, 0, 0, 0.6, NULL, 50, 100, false, 'Investimento bloccato per 45 giorni', 'beta')
ON CONFLICT (id) DO NOTHING;

-- updated_at trigger for levels
DROP TRIGGER IF EXISTS update_levels_updated_at ON public.levels;
CREATE TRIGGER update_levels_updated_at
BEFORE UPDATE ON public.levels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 9: New RPC create_investment v2
CREATE OR REPLACE FUNCTION public.create_investment(
  p_user_id uuid,
  p_plan_id uuid,
  p_plan_name text,
  p_amount numeric,
  p_duration integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance numeric;
  v_user_level public.level_name;
  v_level_row public.levels%ROWTYPE;
  v_daily_rate numeric;
  v_investment_id uuid;
BEGIN
  -- Validate duration
  IF p_duration NOT IN (45, 90) THEN
    RAISE EXCEPTION 'Durata non valida: deve essere 45 o 90 giorni';
  END IF;

  -- Lock profile and read state
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

  -- Lookup level config
  SELECT * INTO v_level_row FROM public.levels WHERE id = v_user_level::text;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configurazione livello non trovata';
  END IF;

  -- Gamma/Beta validations
  IF v_user_level = 'gamma' THEN
    IF p_duration <> 45 THEN
      RAISE EXCEPTION 'Il livello Gamma può investire solo nel piano a 45 giorni';
    END IF;
    IF p_amount < COALESCE(v_level_row.investimento_min, 50) OR p_amount > COALESCE(v_level_row.investimento_max, 100) THEN
      RAISE EXCEPTION 'Per Gamma l''investimento deve essere compreso tra % e % USDT', v_level_row.investimento_min, v_level_row.investimento_max;
    END IF;
  END IF;

  IF v_user_level = 'beta' THEN
    IF p_duration <> 45 THEN
      RAISE EXCEPTION 'Il livello Beta può investire solo nel piano a 45 giorni';
    END IF;
    IF p_amount > COALESCE(v_level_row.investimento_max, 100) THEN
      RAISE EXCEPTION 'Per Beta l''investimento massimo è % USDT', v_level_row.investimento_max;
    END IF;
  END IF;

  -- Pick daily_rate based on duration
  IF p_duration = 45 THEN
    v_daily_rate := v_level_row.giornaliero_45;
  ELSE
    v_daily_rate := v_level_row.giornaliero_90;
  END IF;

  IF v_daily_rate IS NULL THEN
    RAISE EXCEPTION 'Questo livello non prevede il piano a % giorni', p_duration;
  END IF;

  -- Lock funds
  UPDATE public.profiles SET
    balance = balance - p_amount,
    balance_available = balance_available - p_amount,
    balance_locked = balance_locked + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Insert investment with snapshot rate + duration
  INSERT INTO public.investments (
    user_id, plan_id, plan_name, amount, days_remaining, status,
    last_payout_at, duration_days, daily_rate
  )
  VALUES (
    p_user_id, p_plan_id, p_plan_name, p_amount, p_duration, 'active',
    now(), p_duration, v_daily_rate
  )
  RETURNING id INTO v_investment_id;

  -- Ledger
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
$$;

-- Step 10: Recursive metrics recompute + auto-promote
CREATE OR REPLACE FUNCTION public.recompute_user_metrics(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_units integer;
  v_production numeric;
  v_new_level public.level_name;
  v_profile_id uuid;
  v_parent_id uuid;
BEGIN
  -- Get this user's profile id (internal id, not user_id)
  SELECT id, referred_by INTO v_profile_id, v_parent_id
  FROM public.profiles WHERE user_id = p_user_id;

  IF v_profile_id IS NULL THEN
    RETURN;
  END IF;

  -- Recursive downline: all descendants of this profile
  WITH RECURSIVE downline AS (
    SELECT id, user_id FROM public.profiles WHERE referred_by = v_profile_id
    UNION ALL
    SELECT p.id, p.user_id
    FROM public.profiles p
    INNER JOIN downline d ON p.referred_by = d.id
  ),
  -- Direct referrals with at least one active investment = "units"
  direct_with_active AS (
    SELECT COUNT(DISTINCT p.id) AS cnt
    FROM public.profiles p
    WHERE p.referred_by = v_profile_id
      AND EXISTS (
        SELECT 1 FROM public.investments i
        WHERE i.user_id = p.user_id AND i.status = 'active'
      )
  ),
  -- Sum of active capital across full downline = "production"
  total_production AS (
    SELECT COALESCE(SUM(i.amount), 0) AS total
    FROM downline d
    JOIN public.investments i ON i.user_id = d.user_id
    WHERE i.status = 'active'
  )
  SELECT (SELECT cnt FROM direct_with_active),
         (SELECT total FROM total_production)
  INTO v_units, v_production;

  -- Determine new level based on requirements (from levels table, descending order)
  SELECT id::public.level_name INTO v_new_level
  FROM public.levels
  WHERE unita_richieste IS NOT NULL
    AND produzione_richiesta IS NOT NULL
    AND v_units >= unita_richieste
    AND v_production >= produzione_richiesta
  ORDER BY ordine DESC
  LIMIT 1;

  -- If no qualifying level found, check beta vs gamma
  -- beta requires "rete" (at least 1 direct referral); else gamma
  IF v_new_level IS NULL THEN
    IF v_units >= 1 THEN
      v_new_level := 'beta'::public.level_name;
    ELSE
      -- Keep current if already higher or not in standard progression; default gamma
      v_new_level := 'gamma'::public.level_name;
    END IF;
  END IF;

  -- Update this user's metrics + level (don't downgrade if already higher? business rule: always recompute)
  UPDATE public.profiles
  SET units = v_units,
      production = v_production,
      level = v_new_level,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Step 11: Trigger to recompute upline on investment changes
CREATE OR REPLACE FUNCTION public.trg_recompute_upline_on_investment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
  v_parent_user_id uuid;
  v_safety integer := 0;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Recompute self first
  PERFORM public.recompute_user_metrics(v_user_id);

  -- Walk upline
  SELECT referred_by INTO v_profile_id FROM public.profiles WHERE user_id = v_user_id;

  WHILE v_profile_id IS NOT NULL AND v_safety < 50 LOOP
    SELECT user_id, referred_by INTO v_parent_user_id, v_profile_id
    FROM public.profiles WHERE id = v_profile_id;

    IF v_parent_user_id IS NULL THEN
      EXIT;
    END IF;

    PERFORM public.recompute_user_metrics(v_parent_user_id);
    v_safety := v_safety + 1;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_investments_recompute ON public.investments;
CREATE TRIGGER trg_investments_recompute
AFTER INSERT OR UPDATE OF status, amount OR DELETE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.trg_recompute_upline_on_investment();

-- Step 12: Update handle_new_user to default 'gamma' (already default) — ensure trigger present
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 13: Cleanup admin_settings stale level_config (will be obsolete)
DELETE FROM public.admin_settings WHERE key = 'level_config';