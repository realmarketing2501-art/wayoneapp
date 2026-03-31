
-- Create api_integrations table
CREATE TABLE public.api_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'blockchain',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'not_configured',
  last_test_at TIMESTAMP WITH TIME ZONE,
  last_test_result TEXT,
  last_test_error TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view integrations"
  ON public.api_integrations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update integrations"
  ON public.api_integrations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert integrations"
  ON public.api_integrations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default integration records
INSERT INTO public.api_integrations (service_key, service_name, category, config) VALUES
  ('tron_trc20', 'TRON / TRC-20', 'blockchain', '{"api_url":"","api_key":"","company_wallet":""}'),
  ('eth_erc20', 'Ethereum / ERC-20', 'blockchain', '{"infura_api_key":"","company_wallet":"","network":"mainnet"}'),
  ('sendgrid', 'SendGrid Email', 'email', '{"api_key":"","email_from":"","sender_name":""}'),
  ('platform', 'Configurazione Piattaforma', 'platform', '{"wallet_trc20_active":"true","wallet_erc20_active":"false","min_deposit":"50","min_withdraw":"10","fee_fast":"20","fee_medium":"10","fee_slow":"5","maintenance_mode":"false"}');
