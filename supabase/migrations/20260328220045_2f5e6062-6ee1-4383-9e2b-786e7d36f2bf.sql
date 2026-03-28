
-- Add wallet_transactions ledger table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'yield', 'referral_bonus', 'admin_adjustment', 'investment_return')),
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  asset TEXT NOT NULL DEFAULT 'USDT',
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  balance_after NUMERIC,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view own transactions
CREATE POLICY "Users can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all wallet transactions"
  ON public.wallet_transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only backend/admin can insert
CREATE POLICY "Admins can insert wallet transactions"
  ON public.wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add reviewed_by to deposits
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Add reviewed_by to withdrawals  
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Add balance_available and balance_locked to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance_available NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance_locked NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_confirmed_deposit BOOLEAN NOT NULL DEFAULT false;
