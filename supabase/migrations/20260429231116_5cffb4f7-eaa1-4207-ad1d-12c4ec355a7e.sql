ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS coord_report_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS participants_coord_report_token_key
  ON public.participants(coord_report_token);
