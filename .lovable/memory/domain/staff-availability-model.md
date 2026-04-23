---
name: Staff availability model
description: Recurring weekly rules + one-off exceptions; half-hour slot enforcement at input layer
type: feature
---

Two tables:

- `public.staff_availability`: recurring weekly pattern. `day_of_week` 0–6 where 0 = Sunday. `starts_time`/`ends_time` are time-of-day. `effective_from`/`effective_to` are nullable (open-ended). `kind` = 'available' or 'unavailable'.
- `public.staff_availability_exception`: one-off PTO/sick/extra-shift override. `starts_at`/`ends_at` are timestamptz. `kind` = 'available' or 'unavailable'. Exceptions take precedence over the recurring rule.

Capacity for FT vs PT is captured by `staff.contracted_hours_per_week`. The recurring rules describe *when* they're available; the contracted hours describe *how many* hours per week we should fill — a future check, not enforced yet.

Half-hour slot rule lives in **`isHalfHourSlot()`** in `src/hooks/useStaffAvailability.ts` and is enforced by `BookingDrawer` (hard-block with toast) and the Kendo Scheduler's `slotDuration={30}`. The DB stores arbitrary timestamptz so 15-min slots are possible later without migration.

Out of scope for Phase 1 (deferred to Phase 2/3): geocoding addresses, computing travel time between consecutive bookings, Timefold solver REST service in Azure Container Apps, "Suggest best slot" / "Optimise day" actions.