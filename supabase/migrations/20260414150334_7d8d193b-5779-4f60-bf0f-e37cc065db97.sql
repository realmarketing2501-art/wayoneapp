
-- Replace handle_new_user to process referral codes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_code text;
  v_referrer_id uuid;
BEGIN
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';

  -- Find referrer if code provided
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = v_referral_code;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (user_id, username, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || LEFT(NEW.id::text, 8)),
    'WAY1-' || UPPER(LEFT(md5(NEW.id::text), 6)),
    v_referrer_id
  );

  -- Assign default role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- Increment referrer counters
  IF v_referrer_id IS NOT NULL THEN
    UPDATE profiles
    SET direct_referrals = direct_referrals + 1,
        total_network = total_network + 1,
        updated_at = now()
    WHERE id = v_referrer_id;
  END IF;

  RETURN NEW;
END;
$$;
