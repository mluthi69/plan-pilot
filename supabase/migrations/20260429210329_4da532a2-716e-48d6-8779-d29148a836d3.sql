-- Goals linked to a funding agreement category (M:N)
CREATE TABLE public.funding_agreement_category_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  agreement_category_id uuid NOT NULL REFERENCES public.funding_agreement_categories(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.participant_goals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agreement_category_id, goal_id)
);
CREATE INDEX idx_facg_agreement_category ON public.funding_agreement_category_goals(agreement_category_id);
CREATE INDEX idx_facg_goal ON public.funding_agreement_category_goals(goal_id);
CREATE INDEX idx_facg_org ON public.funding_agreement_category_goals(org_id);

ALTER TABLE public.funding_agreement_category_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for funding_agreement_category_goals"
  ON public.funding_agreement_category_goals FOR ALL USING (true) WITH CHECK (true);

-- Goals selected when creating a booking (M:N)
CREATE TABLE public.booking_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.participant_goals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, goal_id)
);
CREATE INDEX idx_booking_goals_booking ON public.booking_goals(booking_id);
CREATE INDEX idx_booking_goals_goal ON public.booking_goals(goal_id);
CREATE INDEX idx_booking_goals_org ON public.booking_goals(org_id);

ALTER TABLE public.booking_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for booking_goals"
  ON public.booking_goals FOR ALL USING (true) WITH CHECK (true);

-- When a visit is created from a booking, seed empty goal-contribution rows
-- for each booking_goals entry so the evidence panel auto-shows them.
CREATE OR REPLACE FUNCTION public.seed_visit_goal_contributions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_id IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.visit_goal_contributions (org_id, visit_id, goal_id)
  SELECT NEW.org_id, NEW.id, bg.goal_id
  FROM public.booking_goals bg
  WHERE bg.booking_id = NEW.booking_id
  ON CONFLICT (visit_id, goal_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- visit_goal_contributions needs the conflict target for the trigger upsert.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'visit_goal_contributions_visit_goal_unique'
  ) THEN
    ALTER TABLE public.visit_goal_contributions
      ADD CONSTRAINT visit_goal_contributions_visit_goal_unique UNIQUE (visit_id, goal_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_seed_visit_goal_contributions ON public.visits;
CREATE TRIGGER trg_seed_visit_goal_contributions
AFTER INSERT ON public.visits
FOR EACH ROW
EXECUTE FUNCTION public.seed_visit_goal_contributions();