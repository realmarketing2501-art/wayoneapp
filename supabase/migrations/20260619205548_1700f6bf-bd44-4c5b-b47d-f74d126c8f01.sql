
-- Extend allowed income types
ALTER TABLE public.income_records DROP CONSTRAINT IF EXISTS income_records_type_check;
ALTER TABLE public.income_records ADD CONSTRAINT income_records_type_check
  CHECK (type = ANY (ARRAY['interest','team','bonus','fund_interest','level_bonus']));

-- Replace daily-returns cron with direct SQL call (no HTTP timeout)
DO $$
DECLARE v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'daily-returns-job';
  IF v_jobid IS NOT NULL THEN PERFORM cron.unschedule(v_jobid); END IF;
END $$;

SELECT cron.schedule(
  'daily-returns-job',
  '0 2 * * *',
  $$SELECT public.process_daily_returns();$$
);

-- Resync special_funds.raised
UPDATE public.special_funds sf
SET raised = COALESCE(t.total, 0)
FROM (
  SELECT fund_id, SUM(amount) AS total
  FROM public.fund_investments
  WHERE status = 'active'
  GROUP BY fund_id
) t
WHERE sf.id = t.fund_id AND sf.raised <> COALESCE(t.total, 0);

UPDATE public.special_funds sf
SET raised = 0
WHERE NOT EXISTS (SELECT 1 FROM public.fund_investments fi WHERE fi.fund_id = sf.id AND fi.status='active')
  AND sf.raised <> 0;

-- Backfill missed daily payouts
DO $$
DECLARE v_loops int := 0; v_res record;
BEGIN
  LOOP
    v_loops := v_loops + 1;
    EXIT WHEN v_loops > 10;
    SELECT * INTO v_res FROM public.process_daily_returns();
    EXIT WHEN COALESCE(v_res.processed,0) = 0;
    UPDATE public.investments
      SET last_payout_at = last_payout_at - interval '25 hours'
      WHERE status='active' AND last_payout_at > now() - interval '24 hours';
    UPDATE public.fund_investments
      SET last_payout_at = last_payout_at - interval '25 hours'
      WHERE status='active' AND last_payout_at > now() - interval '24 hours';
  END LOOP;
END $$;
