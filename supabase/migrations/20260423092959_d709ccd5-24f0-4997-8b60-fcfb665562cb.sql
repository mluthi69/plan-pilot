CREATE TABLE public.plan_budget_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  participant_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT 'Core',
  budget NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_budget_categories_participant ON public.plan_budget_categories(participant_id);
CREATE INDEX idx_plan_budget_categories_org ON public.plan_budget_categories(org_id);

ALTER TABLE public.plan_budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for plan_budget_categories"
  ON public.plan_budget_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_plan_budget_categories_updated_at
  BEFORE UPDATE ON public.plan_budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();