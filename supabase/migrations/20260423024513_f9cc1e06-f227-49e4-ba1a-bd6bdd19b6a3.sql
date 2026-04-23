-- ============ BOOKINGS ============
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  participant_id UUID NOT NULL,
  assigned_worker_id TEXT,
  assigned_worker_name TEXT,
  service_type TEXT NOT NULL DEFAULT 'Support',
  support_item_code TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  location TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_org_starts ON public.bookings(org_id, starts_at);
CREATE INDEX idx_bookings_participant ON public.bookings(participant_id);
CREATE INDEX idx_bookings_worker ON public.bookings(assigned_worker_id);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- ============ VISITS ============
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  booking_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  worker_id TEXT,
  worker_name TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  participant_signed BOOLEAN NOT NULL DEFAULT false,
  participant_signed_at TIMESTAMPTZ,
  participant_signature_name TEXT,
  notes_submitted BOOLEAN NOT NULL DEFAULT false,
  exception_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_visits_org_scheduled ON public.visits(org_id, scheduled_start);
CREATE INDEX idx_visits_worker ON public.visits(worker_id);
CREATE INDEX idx_visits_booking ON public.visits(booking_id);
CREATE INDEX idx_visits_participant ON public.visits(participant_id);
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for visits" ON public.visits FOR ALL USING (true) WITH CHECK (true);

-- ============ NOTES ============
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  participant_id UUID NOT NULL,
  visit_id UUID,
  author_id TEXT,
  author_name TEXT,
  note_type TEXT NOT NULL DEFAULT 'progress',
  template_key TEXT,
  title TEXT,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notes_org_created ON public.notes(org_id, created_at DESC);
CREATE INDEX idx_notes_participant ON public.notes(participant_id);
CREATE INDEX idx_notes_visit ON public.notes(visit_id);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for notes" ON public.notes FOR ALL USING (true) WITH CHECK (true);

-- ============ ATTACHMENTS ============
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  visit_id UUID,
  note_id UUID,
  participant_id UUID,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_visit ON public.attachments(visit_id);
CREATE INDEX idx_attachments_note ON public.attachments(note_id);
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for attachments" ON public.attachments FOR ALL USING (true) WITH CHECK (true);

-- ============ SERVICE AGREEMENTS ============
CREATE TABLE public.service_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  participant_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_value NUMERIC NOT NULL DEFAULT 0,
  cancellation_policy TEXT,
  travel_policy TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agreements_participant ON public.service_agreements(participant_id);
CREATE INDEX idx_agreements_org ON public.service_agreements(org_id);
ALTER TABLE public.service_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service_agreements" ON public.service_agreements FOR ALL USING (true) WITH CHECK (true);

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_visits_updated BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agreements_updated BEFORE UPDATE ON public.service_agreements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE: visit-attachments bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-attachments', 'visit-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read visit-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'visit-attachments');

CREATE POLICY "Anyone can upload visit-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visit-attachments');

CREATE POLICY "Anyone can update visit-attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'visit-attachments');

CREATE POLICY "Anyone can delete visit-attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'visit-attachments');