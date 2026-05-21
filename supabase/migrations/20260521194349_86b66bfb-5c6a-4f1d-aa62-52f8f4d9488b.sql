-- Cleanup duplicate triggers (performance only, no logic change)
DROP TRIGGER IF EXISTS trg_investments_recompute_upline ON public.investments;
DROP TRIGGER IF EXISTS trg_recompute_upline_on_investment ON public.investments;

DROP TRIGGER IF EXISTS trg_protect_user_tasks_ins ON public.user_tasks;
DROP TRIGGER IF EXISTS trg_protect_user_tasks_upd ON public.user_tasks;