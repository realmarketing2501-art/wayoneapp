CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_history boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Blocco se ha storico finanziario reale
  SELECT EXISTS (
    SELECT 1 FROM wallet_transactions WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM deposits WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM withdrawals WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM investments WHERE user_id = p_user_id
    UNION ALL
    SELECT 1 FROM fund_investments WHERE user_id = p_user_id
  ) INTO v_has_history;

  IF v_has_history THEN
    RAISE EXCEPTION 'Utente con storico finanziario: eliminazione bloccata. Puoi sospendere l''account.';
  END IF;

  -- Account test senza storico: pulizia sicura
  DELETE FROM income_records WHERE user_id = p_user_id;
  DELETE FROM deposit_intents WHERE user_id = p_user_id;
  DELETE FROM user_tasks WHERE user_id = p_user_id;
  DELETE FROM user_notifications WHERE user_id = p_user_id;
  DELETE FROM wallets WHERE user_id = p_user_id;
  DELETE FROM user_roles WHERE user_id = p_user_id;
  DELETE FROM profiles WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN true;
END;
$function$;