-- Hardening: revoke EXECUTE from PUBLIC/anon on financial & admin RPCs.
-- They already enforce auth.uid()/has_role internally, but no reason to expose them to anon.

REVOKE EXECUTE ON FUNCTION public.admin_approve_manual_deposit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_manual_deposit(uuid)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_approve_withdrawal(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_withdrawal(uuid)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_investment(uuid, uuid, text, numeric, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.invest_in_fund(uuid, uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_withdrawal(numeric, text, text) FROM anon;
-- has_role can stay callable (read-only role check); get_public_setting is intentionally public.