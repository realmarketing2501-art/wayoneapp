
-- Deposit intents: user requests a deposit
CREATE TABLE public.deposit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_usd numeric NOT NULL,
  amount_usdt numeric NOT NULL,
  unique_suffix numeric NOT NULL DEFAULT 0,
  network text NOT NULL DEFAULT 'TRC-20',
  wallet_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  matched_tx_id uuid,
  package_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deposit_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own deposit intents"
  ON public.deposit_intents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deposit intents"
  ON public.deposit_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit intents"
  ON public.deposit_intents FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deposit intents"
  ON public.deposit_intents FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_deposit_intents_status ON public.deposit_intents(status);
CREATE INDEX idx_deposit_intents_user ON public.deposit_intents(user_id);
CREATE INDEX idx_deposit_intents_network_status ON public.deposit_intents(network, status);

-- Detected transactions: found by blockchain watchers
CREATE TABLE public.detected_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash text NOT NULL,
  network text NOT NULL,
  from_address text,
  to_address text NOT NULL,
  amount numeric NOT NULL,
  token text NOT NULL DEFAULT 'USDT',
  confirmations integer NOT NULL DEFAULT 0,
  block_number bigint,
  block_timestamp timestamptz,
  status text NOT NULL DEFAULT 'detected',
  matched_intent_id uuid REFERENCES public.deposit_intents(id),
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.detected_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all detected transactions"
  ON public.detected_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update detected transactions"
  ON public.detected_transactions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX idx_detected_tx_hash_network ON public.detected_transactions(tx_hash, network);
CREATE INDEX idx_detected_tx_status ON public.detected_transactions(status);
CREATE INDEX idx_detected_tx_to_address ON public.detected_transactions(to_address);

-- Watcher state: tracks sync progress per network
CREATE TABLE public.watcher_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network text NOT NULL UNIQUE,
  last_block_number bigint NOT NULL DEFAULT 0,
  last_block_timestamp timestamptz,
  last_sync_at timestamptz,
  total_detected integer NOT NULL DEFAULT 0,
  total_confirmed integer NOT NULL DEFAULT 0,
  total_credited integer NOT NULL DEFAULT 0,
  total_errors integer NOT NULL DEFAULT 0,
  last_error text,
  last_error_at timestamptz,
  status text NOT NULL DEFAULT 'idle',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.watcher_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view watcher state"
  ON public.watcher_state FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update watcher state"
  ON public.watcher_state FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Insert initial watcher states
INSERT INTO public.watcher_state (network, status) VALUES ('TRC-20', 'idle'), ('ERC-20', 'idle');

-- Security definer function for watcher to update deposit_intents
CREATE OR REPLACE FUNCTION public.process_matched_deposit(
  p_intent_id uuid,
  p_tx_id uuid,
  p_amount numeric,
  p_tx_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_balance numeric;
  v_intent_status text;
BEGIN
  -- Lock and check intent
  SELECT user_id, status INTO v_user_id, v_intent_status
  FROM deposit_intents WHERE id = p_intent_id FOR UPDATE;
  
  IF v_intent_status != 'pending' THEN
    RETURN false;
  END IF;

  -- Get current balance
  SELECT balance, balance_available INTO v_current_balance
  FROM profiles WHERE user_id = v_user_id FOR UPDATE;

  -- Update intent
  UPDATE deposit_intents SET status = 'matched', matched_tx_id = p_tx_id, updated_at = now()
  WHERE id = p_intent_id;

  -- Update detected transaction
  UPDATE detected_transactions SET status = 'credited', matched_intent_id = p_intent_id, updated_at = now()
  WHERE id = p_tx_id;

  -- Credit user balance
  UPDATE profiles SET
    balance = balance + p_amount,
    balance_available = balance_available + p_amount,
    has_confirmed_deposit = true,
    updated_at = now()
  WHERE user_id = v_user_id;

  -- Record in wallet_transactions ledger
  INSERT INTO wallet_transactions (user_id, type, direction, amount, asset, status, description, reference_id, reference_type, balance_after)
  VALUES (v_user_id, 'deposit', 'in', p_amount, 'USDT', 'completed',
    'Deposito automatico ' || p_amount || ' USDT via blockchain',
    p_intent_id, 'deposit_intent',
    v_current_balance + p_amount);

  RETURN true;
END;
$$;

-- Function to expire old intents
CREATE OR REPLACE FUNCTION public.expire_old_deposit_intents()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE deposit_intents SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_deposit_intents_updated_at
  BEFORE UPDATE ON public.deposit_intents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_detected_transactions_updated_at
  BEFORE UPDATE ON public.detected_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_watcher_state_updated_at
  BEFORE UPDATE ON public.watcher_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron and pg_net for scheduled watchers
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
