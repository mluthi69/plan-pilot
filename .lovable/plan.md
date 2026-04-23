

## Phase 1: Staff, Skills, Availability & Bookings link

Foundational data model and UI for staff who can be booked to deliver NDIS services to participants. Routing/travel and Timefold optimisation are deferred to Phase 2/3.

### What you'll get

- A new **Staff** first-class entity with full Australian employee fields and a "bookable" flag
- **Skills** = the 21 NDIS PACE support categories a staff member is qualified for
- **Availability** stored as recurring weekly patterns + one-off exceptions (covers FT and PT)
- **Bookings** linked to a staff member (replacing the loose `assigned_worker_name` text), with a derived-but-overridable location
- A **Staff** management section, a per-staff detail page (skills + availability editor), and the existing Schedule page now grouped by real staff records

### Database schema (new tables)

```text
staff
├── id, org_id
├── first_name, last_name, preferred_name, email, phone, mobile
├── address, suburb, state, postcode
├── date_of_birth, gender
├── employment_type        ('full_time'|'part_time'|'casual'|'contractor')
├── contracted_hours_per_week numeric         -- for FT/PT capacity checks
├── start_date, end_date
├── tfn_last4, super_fund, bank_bsb_last3, bank_acct_last3   (PII redacted)
├── ndis_worker_screening_no, screening_expiry
├── working_with_children_no, wwc_expiry
├── first_aid_expiry, drivers_licence_no, vehicle_available bool
├── bookable bool default true                -- THE flag
├── status ('active'|'on_leave'|'inactive') default 'active'
├── notes, created_at, updated_at

staff_skills        -- which NDIS PACE categories a staff member can deliver
├── id, org_id
├── staff_id  (fk staff.id)
├── support_category text   -- one of 21 PACE codes (enum-validated via trigger)
├── proficiency ('trainee'|'competent'|'expert') default 'competent'
├── certified_at date, expires_at date
├── unique (staff_id, support_category)

staff_availability  -- recurring weekly pattern
├── id, org_id, staff_id
├── day_of_week smallint 0-6 (0 = Sunday)
├── starts_time time, ends_time time
├── effective_from date, effective_to date    -- nullable = open-ended
├── kind ('available'|'unavailable') default 'available'

staff_availability_exception   -- one-off PTO, sick, extra shift
├── id, org_id, staff_id
├── starts_at timestamptz, ends_at timestamptz
├── kind ('available'|'unavailable')
├── reason text

bookings  (additive changes — existing rows preserved)
├── + staff_id uuid                           -- nullable fk to staff.id
├── + support_category text                   -- the PACE category being delivered
├── + location_address text                   -- override
├── + location_source ('participant'|'override') default 'participant'
├── + duration_minutes generated as ((ends_at - starts_at) in min)
├── (existing assigned_worker_id/name kept for back-compat, deprecated)
```

All tables use `org_id` (text, Clerk org) with the same permissive policy your other tables use today, and an `update_updated_at_column` trigger.

A reference table `ndis_support_categories` (seeded with the 21 PACE categories: code + name + budget bucket Core/Capacity/Capital) backs both the Staff skill picker and the Booking category dropdown.

### Half-hour slot constraint

Enforced at the **input layer**, not in the DB:
- `BookingDrawer` time pickers snap to `:00` / `:30`
- The Kendo Scheduler is configured with `slotDuration={30}` and `slotDivisions={1}`
- A small validator rejects non-half-hour starts/ends before insert (clear toast error)

This keeps the DB flexible if you ever need 15-min slots later.

### New hooks

- `useStaff()`, `useStaff(id)`, `useCreateStaff()`, `useUpdateStaff()`, `useDeleteStaff()`
- `useStaffSkills(staffId)`, `useUpsertStaffSkill()`, `useRemoveStaffSkill()`
- `useStaffAvailability(staffId)` — returns merged recurring + exceptions
- `useUpsertAvailability()`, `useUpsertAvailabilityException()`
- `useBookableStaffFor({ category, starts_at, ends_at })` — returns staff who (a) are `bookable && active`, (b) have the skill, (c) are available in their pattern, (d) have no overlapping booking. Pure-SQL for now, will be replaced by Timefold call later.
- `useNdisCategories()` — reads the seed table

### New / changed pages

- **`/staff`** — list page (search, filter by category/status/bookable, table). New sidebar entry under "People".
- **`/staff/:id`** — detail page with three tabs: **Profile** (editable card), **Skills** (multi-select chips for the 21 categories with proficiency + expiry), **Availability** (weekly grid editor + exceptions list).
- **`StaffFormDialog`** — create/edit dialog mirroring the `ProviderFormDialog` pattern.
- **`BookingDrawer`** — replace the free-text "Assign worker" with a real `<Select>` of bookable staff filtered by chosen NDIS category and time window. Add `support_category` dropdown. Add `location_address` field that auto-fills from the participant's address with an "Override location" toggle.
- **`/schedule`** — resource rows now come from real `staff` records (only `bookable=true, status=active`); Workers/Participants toggle stays. Drop-on-row reassign writes `staff_id`. Empty rows for staff with no bookings now still appear.
- **Sidebar** — add **Staff** under the People section (visible to coordinator + owner roles).

### Validation & guard rails

- Booking insert blocked (toast) when chosen staff lacks the support category skill
- Booking insert blocked when staff has overlapping booking or sits outside their availability pattern (with a "book anyway" override for owner/coordinator)
- ABN-style format checks aren't needed; instead WWC/Worker-Screening expiry warnings render on the staff card when within 30 days

### Out of scope (Phase 2 + 3)

- Geocoding addresses, calculating travel time between consecutive bookings, displaying route on a map
- Timefold REST service hosted in Azure Container Apps
- "Optimise day" button + "Suggest best slot for new booking" call

I'll capture these as memory entries so they aren't forgotten.

### Files to create

- `supabase/migrations/<ts>_staff_entity.sql` — all new tables, trigger, seed for `ndis_support_categories`
- `src/hooks/useStaff.ts`, `src/hooks/useStaffSkills.ts`, `src/hooks/useStaffAvailability.ts`, `src/hooks/useNdisCategories.ts`
- `src/pages/Staff.tsx`, `src/pages/StaffDetail.tsx`
- `src/components/StaffFormDialog.tsx`, `src/components/StaffSkillsEditor.tsx`, `src/components/StaffAvailabilityEditor.tsx`
- `mem://domain/staff-entity` and `mem://domain/staff-availability-model`

### Files to modify

- `src/App.tsx` — add `/staff` and `/staff/:id` routes
- `src/components/AppSidebar.tsx` — add Staff nav item
- `src/components/BookingDrawer.tsx` — staff picker, category, location override
- `src/hooks/useBookings.ts` — extend `BookingInput` & `Booking` types with `staff_id`, `support_category`, `location_address`, `location_source`
- `src/pages/Schedule.tsx` — pull worker resources from `useStaff()` not from booking rows
- `src/integrations/supabase/types.ts` — auto-regenerated by the migration

