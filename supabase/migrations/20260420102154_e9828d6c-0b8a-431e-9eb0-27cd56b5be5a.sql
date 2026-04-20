-- Crea trigger trg_recompute_upline_on_investment su investments
DROP TRIGGER IF EXISTS trg_recompute_upline_on_investment ON public.investments;

CREATE TRIGGER trg_recompute_upline_on_investment
AFTER INSERT OR UPDATE OF status, amount ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.trg_recompute_upline_on_investment();