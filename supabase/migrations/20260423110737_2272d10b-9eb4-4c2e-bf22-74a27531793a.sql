-- Phase 2: Locations & Travel

-- 1. Global locations (clinics, offices, community venues)
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  name text NOT NULL,
  location_type text NOT NULL DEFAULT 'community',
  address text NOT NULL,
  suburb text,
  state text,
  postcode text,
  lat double precision,
  lng double precision,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_locations_org ON public.locations(org_id);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for locations" ON public.locations FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Per-participant saved addresses
CREATE TABLE public.participant_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'home',
  address text NOT NULL,
  suburb text,
  state text,
  postcode text,
  lat double precision,
  lng double precision,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_participant_addresses_participant ON public.participant_addresses(participant_id);
CREATE UNIQUE INDEX idx_participant_addresses_one_primary
  ON public.participant_addresses(participant_id) WHERE is_primary = true;

ALTER TABLE public.participant_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for participant_addresses" ON public.participant_addresses FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_participant_addresses_updated_at BEFORE UPDATE ON public.participant_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Extend bookings: structured location reference
ALTER TABLE public.bookings
  ADD COLUMN location_kind text NOT NULL DEFAULT 'override',
  ADD COLUMN participant_address_id uuid REFERENCES public.participant_addresses(id) ON DELETE SET NULL,
  ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN end_lat double precision,
  ADD COLUMN end_lng double precision;

-- 4. Extend staff_bookings: travel-to-this-booking captured per staff
ALTER TABLE public.staff_bookings
  ADD COLUMN travel_minutes_before integer,
  ADD COLUMN travel_km_before numeric(8,2),
  ADD COLUMN travel_from_lat double precision,
  ADD COLUMN travel_from_lng double precision,
  ADD COLUMN travel_from_label text;

-- 5. Booking travel claim lines (billable)
CREATE TABLE public.booking_travel_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  staff_booking_id uuid REFERENCES public.staff_bookings(id) ON DELETE CASCADE,
  line_type text NOT NULL,
  support_item_code text,
  minutes integer NOT NULL DEFAULT 0,
  kilometres numeric(8,2) NOT NULL DEFAULT 0,
  unit_rate numeric(10,2),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  mmm_zone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_travel_lines_booking ON public.booking_travel_lines(booking_id);
ALTER TABLE public.booking_travel_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for booking_travel_lines" ON public.booking_travel_lines FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_booking_travel_lines_updated_at BEFORE UPDATE ON public.booking_travel_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Geocode cache (90-day TTL enforced in app code)
CREATE TABLE public.geocode_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address_hash text NOT NULL UNIQUE,
  raw_address text NOT NULL,
  formatted_address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  place_id text,
  components jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_geocode_cache_hash ON public.geocode_cache(address_hash);
ALTER TABLE public.geocode_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for geocode_cache" ON public.geocode_cache FOR SELECT USING (true);
CREATE POLICY "Allow insert for geocode_cache" ON public.geocode_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete for geocode_cache" ON public.geocode_cache FOR DELETE USING (true);
