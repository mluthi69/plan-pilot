CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  participant_id UUID NOT NULL,
  booking_id UUID,
  visit_id UUID,
  channel TEXT NOT NULL DEFAULT 'sms',
  direction TEXT NOT NULL DEFAULT 'outbound',
  template_key TEXT,
  subject TEXT,
  body TEXT NOT NULL DEFAULT '',
  recipient TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_by TEXT,
  sent_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for messages"
  ON public.messages FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX idx_messages_org_participant
  ON public.messages (org_id, participant_id, created_at DESC);

CREATE INDEX idx_messages_org_created
  ON public.messages (org_id, created_at DESC);