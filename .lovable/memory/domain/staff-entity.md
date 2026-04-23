---
name: Staff entity
description: First-class staff entity replaces free-text worker on bookings; carries Australian employee fields, bookable flag, and PACE category skills
type: feature
---

Staff is a first-class entity (`public.staff`).

- Required: first_name, last_name, employment_type ('full_time'|'part_time'|'casual'|'contractor'), status ('active'|'on_leave'|'inactive'), bookable (default true).
- Compliance fields: ndis_worker_screening_no + screening_expiry, working_with_children_no + wwc_expiry, first_aid_expiry, drivers_licence_no, vehicle_available. WWC/screening expiry within 30 days surfaces a warn badge on the staff card.
- PII redaction: only last4/last3 of TFN/BSB/account stored.

Skills (`public.staff_skills`) link a staff member to one of the 21 NDIS PACE support categories (`public.ndis_support_categories`, code = e.g. `01_assistance_daily_life`). Proficiency is trainee|competent|expert. Bookings record `support_category` and the BookingDrawer hard-blocks if the assigned staff lacks that skill.

Bookings link via `bookings.staff_id` (nullable; ON DELETE SET NULL). The legacy `assigned_worker_id`/`assigned_worker_name` columns are kept for back-compat and currently mirrored from `staff_id` so the Visits/Schedule UIs continue to work.

Schedule view's worker resource rows come from `staff` (filter `bookable=true && status='active'`). All staff members appear as rows even if they have no bookings that day.