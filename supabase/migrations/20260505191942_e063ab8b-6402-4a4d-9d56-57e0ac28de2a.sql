ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_direction_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_direction_check CHECK (direction = ANY (ARRAY['in'::text, 'out'::text]));

ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check CHECK (type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'investment'::text, 'investment_unlock'::text, 'interest'::text, 'yield'::text, 'referral_bonus'::text, 'admin_adjustment'::text, 'investment_return'::text]));