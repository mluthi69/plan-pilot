---
name: Staff entity
description: First-class staff entity replaces free-text worker on bookings; carries Australian employee fields, bookable flag, and PACE category skills
type: feature
---

Staff is a first-class entity (`public.staff`).

- Required: first_name, last_name, employment_type ('full_time'|'part_time'|'casual'|'contractor'), status ('active'|'on_leave'|'inactive'), bookable (default true).
- Compliance fields: ndis_worker_screening_no + screening_expiry, working_with_children_no + wwc_expiry, first_aid_expiry, drivers_licence_no, vehicle_available. WWC/screening expiry within 30 days surfaces a warn badge on the staff card.
- PII redaction: only last4/last3 of TFN/BSB/account stored.

Skills (`public.staff_skills`) link a staff member to one of the 21 NDIS PACE support categories (`public.ndis_support_categories`, code = e.g. `01_assistance_daily_life`). Proficiency is trainee|competent|expert. Bookings record `support_category`.

Bookings ↔ staff is **many-to-many** via the `public.staff_bookings` link table (`booking_id`, `staff_id`, `role` ∈ primary|support|shadow|observer; UNIQUE(booking_id, staff_id); both FKs ON DELETE CASCADE). A single booking can have many staff (e.g. a 2:1 personal-care shift) and a staff member can carry many bookings. **`bookings` does NOT have a `staff_id` column.**

There are NO denormalised worker columns. `bookings` and `visits` carry NO `assigned_worker_*` / `worker_*` fields — assignments live exclusively on `staff_bookings` and are joined on read. `Booking.staff: BookingStaff[]` and `Visit.staff: VisitStaff[]` (derived via `bookings → staff_bookings → staff`) are the canonical worker lists.

Across hooks, joined parents are exposed as embedded objects (no parallel `*_name` strings): `Booking.participant`, `Visit.participant`, `Note.participant`, `Message.participant`, `Invoice.participant` + `Invoice.provider`, `ServiceAgreement.participant`.

Schedule view's worker resource rows come from `staff` (filter `bookable=true && status='active'`). All staff members appear as rows even if they have no bookings that day. A booking with N assigned staff renders N events on the Scheduler — one per staff lane, keyed by `${booking_id}::${staff_id}`. Drag across lanes does NOT reassign (use the BookingDrawer to manage the staff list); time/resize edits still write back to the single booking row.