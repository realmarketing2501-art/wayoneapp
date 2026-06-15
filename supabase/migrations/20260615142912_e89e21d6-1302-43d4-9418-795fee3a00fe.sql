CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Bypass: admin, contesti senza utente (cron/service_role), o esecuzione dentro
  -- una funzione SECURITY DEFINER (current_user != session_user => owner elevato)
  IF auth.uid() IS NULL
     OR current_user <> session_user
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
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
$function$;