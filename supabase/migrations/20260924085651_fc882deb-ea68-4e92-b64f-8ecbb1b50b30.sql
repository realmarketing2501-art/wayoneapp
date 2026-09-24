ALTER TABLE public.watcher_state
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sync_from timestamptz,
  ADD COLUMN IF NOT EXISTS last_sync_to timestamptz,
  ADD COLUMN IF NOT EXISTS last_found integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_new integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_duplicates integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_pages integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS ux_deposits_network_tx_hash ON public.deposits (network, tx_hash) WHERE tx_hash IS NOT NULL;