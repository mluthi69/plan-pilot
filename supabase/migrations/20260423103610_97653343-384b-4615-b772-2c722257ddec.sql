-- Drop the single-staff column on bookings (assignment now lives on the link table)
ALTER TABLE public.bookings DROP COLUMN IF EXISTS staff_id;

-- Many-to-many link: a booking can have multiple staff, a staff member can have many bookings
CREATE TABLE public.staff_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'primary' CHECK (role IN ('primary','support','shadow','observer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, staff_id)
);

CREATE INDEX idx_staff_bookings_booking ON public.staff_bookings(booking_id);
CREATE INDEX idx_staff_bookings_staff ON public.staff_bookings(staff_id);
CREATE INDEX idx_staff_bookings_org ON public.staff_bookings(org_id);

ALTER TABLE public.staff_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for staff_bookings" ON public.staff_bookings FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_staff_bookings_updated_at
  BEFORE UPDATE ON public.staff_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();