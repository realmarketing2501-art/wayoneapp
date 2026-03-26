
-- DEPOSITS table
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  network TEXT NOT NULL DEFAULT 'TRC-20',
  tx_hash TEXT,
  from_address TEXT,
  to_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmations INT DEFAULT 0,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NETWORK TREE table
CREATE TABLE public.network_tree (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_id UUID,
  branch_position INT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  investment_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, branch_position)
);
ALTER TABLE public.network_tree ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own network" ON public.network_tree FOR SELECT TO authenticated USING (true);

-- NOTIFICATIONS table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  target_audience TEXT DEFAULT 'all',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications viewable by authenticated" ON public.notifications FOR SELECT TO authenticated USING (true);

-- USER NOTIFICATIONS table
CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);

-- POPUP NOTIFICATIONS table
CREATE TABLE public.popup_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  target_audience TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.popup_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Popups viewable by authenticated" ON public.popup_notifications FOR SELECT TO authenticated USING (true);

-- ADMIN SETTINGS table
CREATE TABLE public.admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by authenticated" ON public.admin_settings FOR SELECT TO authenticated USING (true);

-- FUND INVESTMENTS table
CREATE TABLE public.fund_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fund_id UUID NOT NULL REFERENCES public.special_funds(id),
  amount NUMERIC NOT NULL,
  total_earned NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fund_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own fund investments" ON public.fund_investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own fund investments" ON public.fund_investments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- INDEXES
CREATE INDEX idx_deposits_user ON public.deposits(user_id);
CREATE INDEX idx_deposits_tx ON public.deposits(tx_hash);
CREATE INDEX idx_deposits_status ON public.deposits(status);
CREATE INDEX idx_network_parent ON public.network_tree(parent_id);
CREATE INDEX idx_network_user ON public.network_tree(user_id);
CREATE INDEX idx_fund_investments_user ON public.fund_investments(user_id);
CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id);

-- DEFAULT ADMIN SETTINGS
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('pre_qualification_rate', '0.80', 'Daily % pre-qualification'),
  ('min_deposit', '50', 'Minimum deposit USDT'),
  ('max_deposit_solo', '100', 'Max deposit solo investors'),
  ('withdrawal_fee_fast', '20', 'Fast withdrawal fee %'),
  ('withdrawal_fee_medium', '10', 'Medium withdrawal fee %'),
  ('withdrawal_fee_slow', '5', 'Slow withdrawal fee %'),
  ('company_wallet_trc20', '', 'Company TRC-20 wallet address'),
  ('company_wallet_erc20', '', 'Company ERC-20 wallet address'),
  ('maintenance_mode', 'false', 'Maintenance mode'),
  ('min_withdrawal', '10', 'Min withdrawal USDT');
