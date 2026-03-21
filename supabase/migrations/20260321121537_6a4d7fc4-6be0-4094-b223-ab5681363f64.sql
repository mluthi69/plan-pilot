
-- Providers table
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  abn TEXT NOT NULL,
  registration TEXT NOT NULL DEFAULT 'unregistered' CHECK (registration IN ('registered', 'unregistered')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  services TEXT[] NOT NULL DEFAULT '{}',
  contact TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ndis_number TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'review', 'expiring')),
  plan_start DATE,
  plan_end DATE,
  total_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'Core' CHECK (category IN ('Core', 'Capacity Building', 'Capital')),
  line_count INT NOT NULL DEFAULT 1,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'exception', 'rejected')),
  submitted_by TEXT,
  approved_by TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  performed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies - tenant isolation
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Since we use Clerk (not Supabase Auth), we need permissive policies
-- that allow authenticated access. Tenant isolation is enforced at the application level via Clerk org_id.
-- For now, allow all operations (Clerk handles auth/authz)
CREATE POLICY "Allow all for providers" ON public.providers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for activity_log" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_providers_org_id ON public.providers(org_id);
CREATE INDEX idx_participants_org_id ON public.participants(org_id);
CREATE INDEX idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX idx_invoices_provider_id ON public.invoices(provider_id);
CREATE INDEX idx_invoices_participant_id ON public.invoices(participant_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_contracts_org_id ON public.contracts(org_id);
CREATE INDEX idx_contracts_provider_id ON public.contracts(provider_id);
CREATE INDEX idx_activity_log_org_id ON public.activity_log(org_id);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
