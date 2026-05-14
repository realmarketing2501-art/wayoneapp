REVOKE EXECUTE ON FUNCTION public.record_signup_event(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_signup_event(jsonb) TO service_role;