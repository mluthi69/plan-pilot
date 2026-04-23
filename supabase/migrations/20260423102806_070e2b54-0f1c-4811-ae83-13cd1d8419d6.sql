-- ============================================================
-- STAFF ENTITY
-- ============================================================
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  preferred_name text,
  email text,
  phone text,
  mobile text,
  address text,
  suburb text,
  state text,
  postcode text,
  date_of_birth date,
  gender text,
  employment_type text NOT NULL DEFAULT 'casual' CHECK (employment_type IN ('full_time','part_time','casual','contractor')),
  contracted_hours_per_week numeric,
  start_date date,
  end_date date,
  tfn_last4 text,
  super_fund text,
  bank_bsb_last3 text,
  bank_acct_last3 text,
  ndis_worker_screening_no text,
  screening_expiry date,
  working_with_children_no text,
  wwc_expiry date,
  first_aid_expiry date,
  drivers_licence_no text,
  vehicle_available boolean NOT NULL DEFAULT false,
  bookable boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_leave','inactive')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_org_id ON public.staff(org_id);
CREATE INDEX idx_staff_bookable_status ON public.staff(org_id, bookable, status);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- NDIS SUPPORT CATEGORIES (21 PACE categories)
-- ============================================================
CREATE TABLE public.ndis_support_categories (
  code text PRIMARY KEY,
  name text NOT NULL,
  budget_bucket text NOT NULL CHECK (budget_bucket IN ('Core','Capacity Building','Capital')),
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.ndis_support_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read all ndis_support_categories" ON public.ndis_support_categories FOR SELECT USING (true);

INSERT INTO public.ndis_support_categories (code, name, budget_bucket, sort_order) VALUES
  ('01_assistance_daily_life', 'Assistance with Daily Life', 'Core', 10),
  ('02_transport', 'Transport', 'Core', 20),
  ('03_consumables', 'Consumables', 'Core', 30),
  ('04_social_community_civic', 'Assistance with Social, Economic and Community Participation', 'Core', 40),
  ('09_increased_social_community', 'Increased Social and Community Participation', 'Capacity Building', 90),
  ('10_finding_keeping_job', 'Finding and Keeping a Job', 'Capacity Building', 100),
  ('11_relationships', 'Improved Relationships', 'Capacity Building', 110),
  ('12_health_wellbeing', 'Improved Health and Wellbeing', 'Capacity Building', 120),
  ('13_lifelong_learning', 'Improved Learning', 'Capacity Building', 130),
  ('14_choice_control', 'Improved Life Choices', 'Capacity Building', 140),
  ('15_daily_living', 'Improved Daily Living Skills', 'Capacity Building', 150),
  ('16_support_coordination', 'Support Coordination', 'Capacity Building', 160),
  ('17_specialist_support_coordination', 'Specialist Support Coordination', 'Capacity Building', 170),
  ('18_psychosocial_recovery', 'Psychosocial Recovery Coaching', 'Capacity Building', 180),
  ('19_plan_management', 'Plan Management', 'Capacity Building', 190),
  ('05_assistive_technology', 'Assistive Technology', 'Capital', 50),
  ('06_home_modifications', 'Home Modifications', 'Capital', 60),
  ('07_specialist_disability_accommodation', 'Specialist Disability Accommodation', 'Capital', 70),
  ('20_behaviour_support', 'Improved Relationships – Behaviour Support', 'Capacity Building', 200),
  ('21_early_childhood_supports', 'Early Childhood Supports', 'Capacity Building', 210),
  ('08_assistance_high_intensity', 'High Intensity Daily Personal Activities', 'Core', 80);

-- ============================================================
-- STAFF SKILLS
-- ============================================================
CREATE TABLE public.staff_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  support_category text NOT NULL REFERENCES public.ndis_support_categories(code),
  proficiency text NOT NULL DEFAULT 'competent' CHECK (proficiency IN ('trainee','competent','expert')),
  certified_at date,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, support_category)
);

CREATE INDEX idx_staff_skills_staff ON public.staff_skills(staff_id);
CREATE INDEX idx_staff_skills_category ON public.staff_skills(support_category);

ALTER TABLE public.staff_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for staff_skills" ON public.staff_skills FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_staff_skills_updated_at
  BEFORE UPDATE ON public.staff_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STAFF AVAILABILITY (recurring weekly pattern)
-- ============================================================
CREATE TABLE public.staff_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  starts_time time NOT NULL,
  ends_time time NOT NULL,
  effective_from date,
  effective_to date,
  kind text NOT NULL DEFAULT 'available' CHECK (kind IN ('available','unavailable')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_availability_staff ON public.staff_availability(staff_id);

ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for staff_availability" ON public.staff_availability FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_staff_availability_updated_at
  BEFORE UPDATE ON public.staff_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STAFF AVAILABILITY EXCEPTIONS (one-off PTO/sick/extra)
-- ============================================================
CREATE TABLE public.staff_availability_exception (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  kind text NOT NULL DEFAULT 'unavailable' CHECK (kind IN ('available','unavailable')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_avail_exc_staff ON public.staff_availability_exception(staff_id);
CREATE INDEX idx_staff_avail_exc_range ON public.staff_availability_exception(staff_id, starts_at, ends_at);

ALTER TABLE public.staff_availability_exception ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for staff_availability_exception" ON public.staff_availability_exception FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_staff_avail_exc_updated_at
  BEFORE UPDATE ON public.staff_availability_exception
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- BOOKINGS — additive columns for staff link, category, location
-- ============================================================
ALTER TABLE public.bookings
  ADD COLUMN staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN support_category text REFERENCES public.ndis_support_categories(code),
  ADD COLUMN location_address text,
  ADD COLUMN location_source text NOT NULL DEFAULT 'participant' CHECK (location_source IN ('participant','override'));

CREATE INDEX idx_bookings_staff ON public.bookings(staff_id);
CREATE INDEX idx_bookings_staff_time ON public.bookings(staff_id, starts_at, ends_at);
