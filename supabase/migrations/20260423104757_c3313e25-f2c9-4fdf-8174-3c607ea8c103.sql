-- Greenfield cleanup: remove legacy denormalised worker fields.
-- Worker info now lives on staff_bookings (M2M) and is joined on read.
ALTER TABLE public.bookings DROP COLUMN IF EXISTS assigned_worker_id;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS assigned_worker_name;
ALTER TABLE public.visits DROP COLUMN IF EXISTS worker_id;
ALTER TABLE public.visits DROP COLUMN IF EXISTS worker_name;