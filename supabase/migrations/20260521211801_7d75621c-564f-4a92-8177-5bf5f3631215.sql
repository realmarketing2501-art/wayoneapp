INSERT INTO public.admin_settings (key, value, description)
VALUES
  ('level_plan_short_days', '45', 'Giorni del piano breve associato al campo giornaliero_45 dei livelli'),
  ('level_plan_long_days',  '90', 'Giorni del piano lungo associato al campo giornaliero_90 dei livelli')
ON CONFLICT (key) DO NOTHING;