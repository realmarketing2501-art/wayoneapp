
-- Add suspended flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- Function to fully delete a user (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete related data
  DELETE FROM wallet_transactions WHERE user_id = p_user_id;
  DELETE FROM income_records WHERE user_id = p_user_id;
  DELETE FROM investments WHERE user_id = p_user_id;
  DELETE FROM deposit_intents WHERE user_id = p_user_id;
  DELETE FROM deposits WHERE user_id = p_user_id;
  DELETE FROM withdrawals WHERE user_id = p_user_id;
  DELETE FROM fund_investments WHERE user_id = p_user_id;
  DELETE FROM user_tasks WHERE user_id = p_user_id;
  DELETE FROM user_notifications WHERE user_id = p_user_id;
  DELETE FROM wallets WHERE user_id = p_user_id;
  DELETE FROM user_roles WHERE user_id = p_user_id;
  DELETE FROM profiles WHERE user_id = p_user_id;
  -- Remove from auth.users
  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN true;
END;
$$;
