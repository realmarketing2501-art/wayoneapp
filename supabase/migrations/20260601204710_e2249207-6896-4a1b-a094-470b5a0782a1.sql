ALTER TABLE public.levels
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pool_id uuid NULL REFERENCES public.special_funds(id) ON DELETE SET NULL;

UPDATE public.admin_settings SET value = '75' WHERE key = 'level_plan_short_days';

-- Inserisci senza prossimo_livello per evitare FK
INSERT INTO public.levels (id, name, ordine, bonus_percentuale, bonus_valore, produzione_richiesta, durata_giorni, giornaliero_45, giornaliero_90, rete, active, note)
VALUES
  ('beta'::public.level_name,         'Silver',          2, 0.5, 360,       72000,      90, 1.0, 1.5, true, true, 'Livello 2 — rete attiva'),
  ('bronze'::public.level_name,       'Gold',            3, 0.5, 3240,      648000,     90, 1.0, 1.5, true, true, 'Livello 3 — rete attiva'),
  ('silver'::public.level_name,       'Platinum',        4, 0.5, 19440,     3888000,    90, 1.0, 1.5, true, true, 'Livello 4 — rete attiva'),
  ('silver_elite'::public.level_name, 'Platinum Elite',  5, 0.5, 155520,    31104000,   90, 1.0, 1.5, true, true, 'Livello 5 — rete attiva'),
  ('gold'::public.level_name,         'Smeraldo',        6, 0.5, 933120,    186624000,  90, 1.0, 1.5, true, true, 'Livello top — Smeraldo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  ordine = EXCLUDED.ordine,
  bonus_percentuale = EXCLUDED.bonus_percentuale,
  bonus_valore = EXCLUDED.bonus_valore,
  produzione_richiesta = EXCLUDED.produzione_richiesta,
  durata_giorni = EXCLUDED.durata_giorni,
  giornaliero_45 = EXCLUDED.giornaliero_45,
  giornaliero_90 = EXCLUDED.giornaliero_90,
  rete = EXCLUDED.rete,
  active = EXCLUDED.active,
  note = EXCLUDED.note;

-- Ora collega la catena prossimo_livello
UPDATE public.levels SET prossimo_livello = 'beta'::public.level_name         WHERE id = 'gamma';
UPDATE public.levels SET prossimo_livello = 'bronze'::public.level_name       WHERE id = 'beta';
UPDATE public.levels SET prossimo_livello = 'silver'::public.level_name       WHERE id = 'bronze';
UPDATE public.levels SET prossimo_livello = 'silver_elite'::public.level_name WHERE id = 'silver';
UPDATE public.levels SET prossimo_livello = 'gold'::public.level_name         WHERE id = 'silver_elite';
UPDATE public.levels SET prossimo_livello = NULL                              WHERE id = 'gold';