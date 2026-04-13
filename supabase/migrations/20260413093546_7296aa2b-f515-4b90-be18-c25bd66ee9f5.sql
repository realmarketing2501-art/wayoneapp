
-- Unique constraint to prevent double-crediting: one intent can only be matched once
CREATE UNIQUE INDEX IF NOT EXISTS idx_detected_transactions_matched_intent_unique 
ON public.detected_transactions (matched_intent_id) 
WHERE matched_intent_id IS NOT NULL;
