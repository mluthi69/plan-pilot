-- ============ ORG SETTINGS ============
CREATE TABLE public.org_settings (
  org_id text PRIMARY KEY,
  allow_unspent_rollover boolean NOT NULL DEFAULT false,
  require_geo_checkin boolean NOT NULL DEFAULT false,
  require_goal_contribution boolean NOT NULL DEFAULT false,
  default_period_length_months integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for org_settings" ON public.org_settings FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_org_settings_updated BEFORE UPDATE ON public.org_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FUNDING AGREEMENTS ============
CREATE TABLE public.funding_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  participant_id uuid NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- draft | active | expired | cancelled
  start_date date NOT NULL,
  end_date date NOT NULL,
  period_length_months integer NOT NULL DEFAULT 3,
  allow_unspent_rollover boolean, -- nullable: inherit org default when null
  notes text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.funding_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for funding_agreements" ON public.funding_agreements FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_funding_agreements_participant ON public.funding_agreements(participant_id);
CREATE TRIGGER trg_funding_agreements_updated BEFORE UPDATE ON public.funding_agreements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.funding_agreement_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  agreement_id uuid NOT NULL REFERENCES public.funding_agreements(id) ON DELETE CASCADE,
  support_category_code text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agreement_id, support_category_code)
);
ALTER TABLE public.funding_agreement_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for funding_agreement_categories" ON public.funding_agreement_categories FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_fac_agreement ON public.funding_agreement_categories(agreement_id);
CREATE TRIGGER trg_fac_updated BEFORE UPDATE ON public.funding_agreement_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.funding_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  agreement_category_id uuid NOT NULL REFERENCES public.funding_agreement_categories(id) ON DELETE CASCADE,
  period_index integer NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  allocated_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agreement_category_id, period_index)
);
ALTER TABLE public.funding_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for funding_periods" ON public.funding_periods FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_fp_cat ON public.funding_periods(agreement_category_id);
CREATE INDEX idx_fp_dates ON public.funding_periods(period_start, period_end);
CREATE TRIGGER trg_fp_updated BEFORE UPDATE ON public.funding_periods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate periods when a category is inserted or its total_amount changes.
CREATE OR REPLACE FUNCTION public.regenerate_funding_periods()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  agr public.funding_agreements%ROWTYPE;
  months_per_period int;
  total_months int;
  num_periods int;
  per_period numeric;
  i int;
  p_start date;
  p_end date;
BEGIN
  SELECT * INTO agr FROM public.funding_agreements WHERE id = NEW.agreement_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  months_per_period := GREATEST(1, COALESCE(agr.period_length_months, 3));
  total_months := GREATEST(1, ((EXTRACT(YEAR FROM agr.end_date)::int - EXTRACT(YEAR FROM agr.start_date)::int) * 12)
                + (EXTRACT(MONTH FROM agr.end_date)::int - EXTRACT(MONTH FROM agr.start_date)::int) + 1);
  num_periods := CEIL(total_months::numeric / months_per_period::numeric);
  per_period := ROUND((NEW.total_amount / num_periods)::numeric, 2);

  -- Wipe existing and regenerate
  DELETE FROM public.funding_periods WHERE agreement_category_id = NEW.id;

  FOR i IN 0..(num_periods - 1) LOOP
    p_start := (agr.start_date + make_interval(months => i * months_per_period));
    p_end := LEAST(agr.end_date, (agr.start_date + make_interval(months => (i + 1) * months_per_period) - INTERVAL '1 day')::date);
    INSERT INTO public.funding_periods (org_id, agreement_category_id, period_index, period_start, period_end, allocated_amount)
    VALUES (NEW.org_id, NEW.id, i, p_start, p_end, per_period);
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fac_regen_periods
AFTER INSERT OR UPDATE OF total_amount ON public.funding_agreement_categories
FOR EACH ROW EXECUTE FUNCTION public.regenerate_funding_periods();

-- ============ PARTICIPANT GOALS ============
CREATE TABLE public.participant_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  participant_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  ndis_outcome_domain text,
  status text NOT NULL DEFAULT 'active', -- active | achieved | discontinued
  target_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.participant_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for participant_goals" ON public.participant_goals FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_goals_participant ON public.participant_goals(participant_id);
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.participant_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.visit_goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  visit_id uuid NOT NULL,
  goal_id uuid NOT NULL REFERENCES public.participant_goals(id) ON DELETE CASCADE,
  contribution_note text,
  progress_rating smallint, -- 1..5
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  UNIQUE (visit_id, goal_id)
);
ALTER TABLE public.visit_goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for visit_goal_contributions" ON public.visit_goal_contributions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_vgc_visit ON public.visit_goal_contributions(visit_id);

-- ============ VISIT GEO FIXES ============
CREATE TABLE public.visit_geo_fixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  visit_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'check_in', -- check_in | check_out | midpoint
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy_m numeric,
  captured_at timestamptz NOT NULL DEFAULT now(),
  captured_by text
);
ALTER TABLE public.visit_geo_fixes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for visit_geo_fixes" ON public.visit_geo_fixes FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_geo_visit ON public.visit_geo_fixes(visit_id);

-- ============ INVOICE LINES ============
CREATE TABLE public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  invoice_id uuid NOT NULL,
  visit_id uuid,
  support_item_code text,
  support_category_code text,
  description text,
  unit text NOT NULL DEFAULT 'hours', -- hours | each | km
  quantity numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  evidence_pack_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evidence_pack_token)
);
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for invoice_lines" ON public.invoice_lines FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_invoice_lines_invoice ON public.invoice_lines(invoice_id);
CREATE INDEX idx_invoice_lines_visit ON public.invoice_lines(visit_id);
CREATE TRIGGER trg_invoice_lines_updated BEFORE UPDATE ON public.invoice_lines
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BOOKINGS: pricing/quantity ============
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'hours',
  ADD COLUMN IF NOT EXISTS unit_price numeric;