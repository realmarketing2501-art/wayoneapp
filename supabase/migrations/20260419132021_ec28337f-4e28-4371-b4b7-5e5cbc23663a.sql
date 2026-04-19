ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS last_payout_at timestamp with time zone;

-- Backfill: per investimenti esistenti, imposta last_payout_at = created_at
-- così riceveranno il prossimo interesse 24h dopo la creazione
UPDATE public.investments 
SET last_payout_at = created_at 
WHERE last_payout_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_investments_status_last_payout 
ON public.investments(status, last_payout_at) 
WHERE status = 'active';