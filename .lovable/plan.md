
# Evidence Pack & Funding-Aware Invoicing

This is a large feature spanning goals, appointment evidence, funding-period budgets, booking-time funding checks, batch draft invoice generation, and a public Evidence Pack report. I propose phasing it so each phase is shippable and testable.

## Phase 1 — Participant Goals & Appointment Goal Tracking

**New tables**
- `participant_goals` — `id, org_id, participant_id, title, description, ndis_outcome_domain, status (active/achieved/discontinued), target_date, sort_order`
- `visit_goal_contributions` — `id, org_id, visit_id, goal_id, contribution_note, progress_rating (1–5), created_at, created_by`

**UI**
- New "Goals" tab on `ParticipantDetail` to CRUD goals.
- `BookingDrawer`: multi-select goals to target during this appointment (writes pending goal links on visit creation).
- `VisitDetail`: "Goal contributions" panel — each linked goal gets a rating + free-text note. Required before marking visit complete.

## Phase 2 — Evidence Pack on Visits

Evidence pack = staff-captured proof during a visit. Builds on existing `attachments`, `notes`, and `visits.participant_signed`.

**New table**
- `visit_geo_fixes` — `id, org_id, visit_id, kind (check_in/check_out/midpoint), lat, lng, accuracy_m, captured_at, captured_by`

**UI changes on `VisitDetail`**
- "Check in" button captures geolocation → `visit_geo_fixes` + sets `actual_start`.
- "Check out" button mirrors at end.
- Existing photo/file uploads stay in `attachments`.
- Notes panel gains an **AI-assist** button (Lovable AI, `google/gemini-3-flash-preview`) that drafts a progress note using:
  - Participant's recent note history
  - Service type + support category
  - Selected goals + contribution ratings
  - Returns a draft the worker edits and saves.
- New "Evidence pack" summary card on the visit showing geo fixes count, photos count, notes count, signature, goal contributions — visual completeness checklist.

## Phase 3 — Funding Agreements with Funding Periods

This replaces the current single-bucket budget thinking with category-level agreements split into periods.

**New tables**
- `funding_agreements` — `id, org_id, participant_id, title, start_date, end_date, status (draft/active/expired/cancelled), period_length_months (default 3), allow_unspent_rollover (override of org setting, nullable)`
- `funding_agreement_categories` — `id, agreement_id, support_category_code, total_amount`
- `funding_periods` — generated rows: `id, agreement_category_id, period_index, period_start, period_end, allocated_amount` (auto-created when an agreement is activated; equal split unless overridden).

**Org settings**
- Add to a `org_settings` table (or extend existing settings storage): `allow_unspent_rollover BOOLEAN DEFAULT false`. Surfaced on `Settings` page.

**Rules enforced everywhere**
- A booking spends from the period its date falls in.
- If `allow_unspent_rollover` is true, leftover from earlier periods adds to the current period's available amount.
- **Never** consume future periods.

**UI**
- New "Funding" tab on `ParticipantDetail` showing agreements, categories, periods, and per-period spend bars.
- `AgreementBuilderDialog` evolves into a Funding Agreement builder with category rows + period preview.

## Phase 4 — Booking-Time Funding Check

**Booking changes (`bookings` table)**
- Add `quantity NUMERIC` and `unit text` (`hours` | `each` | `km`) and `support_item_code text` (already exists) and `unit_price NUMERIC` snapshotted at booking time.

**`BookingDrawer` changes**
- Support category dropdown is **populated from the participant's active agreement**, not the global NDIS list.
- After category select, support item code dropdown filtered to that category.
- Quantity input (auto-derived from start/end as hh:mm for time-based items, editable).
- Live "Funding check" panel:
  - Reads target period from booking date.
  - Sums committed/pending/paid spend from existing bookings + invoices in that period and category.
  - Adds rollover from prior periods if org setting allows.
  - Shows: `Available $X · This booking $Y · Remaining $Z` with red/amber/green badge.
  - Hard-blocks save if booking exceeds available (unless user has override role).

**New helper**
- `src/lib/fundingPeriods.ts` — pure functions: `findPeriodFor(date, periods)`, `computeAvailable(period, spend, rolloverEnabled, priorPeriods)`.

## Phase 5 — Batch Draft Invoice Generator

Replace the current "one button per visit" `InvoiceDrafts` flow with a batch grouped by participant.

**New tables**
- `invoice_lines` — `id, org_id, invoice_id, visit_id, support_item_code, unit, quantity, unit_price, amount, evidence_pack_token (uuid)`

**Edge function: `generate-draft-invoices`**
- Triggered manually from `InvoiceDrafts` ("Generate this week") or by `pg_cron` weekly.
- Pulls all `visits.status = 'completed'` with no existing `invoice_lines.visit_id`.
- Validates each: notes_submitted, signature, geo fix present, goal contributions if required, agreement covers period.
- Groups by participant → one draft `invoices` row + N `invoice_lines`.
- Generates a per-line `evidence_pack_token` (UUID) for the magic link.

**UI updates**
- `InvoiceDrafts` page becomes a "Run batch" view + a list of generated draft invoices grouped by participant.
- `Invoices` table — clicking a draft opens an invoice detail page showing each line with its "Evidence Pack" link.

## Phase 6 — Public Evidence Pack Report (Magic Link)

**Edge function: `evidence-pack`** (verify_jwt = false, token-based auth)
- `GET /evidence-pack?token=<uuid>` → returns an HTML report (or JSON for a React renderer).
- Joins invoice line → visit → notes, attachments (signed URLs, 24h), goal contributions, geo fixes, signature.

**New public route**
- `/evidence/:token` — renders the report:
  - Header: participant, period, line summary.
  - For each appointment: time, staff, service item, hh:mm, notes, photo gallery, small Google Map with marker for geo fix, goals worked on, signature block.
- Token only ever exposes that single line's evidence — not the whole invoice.

## Phase 7 — Settings

**Settings page additions**
- Toggle: "Allow unspent funding to roll over to next period" (org-wide default).
- Toggle: "Require geo check-in for visit completion".
- Toggle: "Require goal contribution before visit completion".
- Number: "Default funding period length (months)" — default 3.

---

## Technical notes

- **AI note assist**: edge function `draft-visit-note` calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a structured prompt; never call from the client.
- **Funding math** lives in `src/lib/fundingPeriods.ts` and is mirrored server-side inside `generate-draft-invoices` so the batch revalidates rather than trusting client state.
- **Rollover rule**: `available(period_n) = allocated(period_n) + (rolloverEnabled ? Σ unspent(period_<n) : 0) − spent(period_n)`. Future periods never contribute.
- **Magic link security**: tokens are random UUIDs, single-line scope, no enumeration. Report is read-only.
- **Migrations only for schema.** Period rows and rollover state are computed on demand or generated by trigger when an agreement is activated.

## Suggested build order

I recommend we approve the plan as a whole but build in this order, each as its own follow-up:

1. Phase 3 (Funding Agreements + Periods) + Phase 7 settings — foundation.
2. Phase 4 (Booking funding check) — immediately useful, prevents overspend.
3. Phase 1 (Goals) + Phase 2 (Evidence pack capture).
4. Phase 5 (Batch draft invoice generator).
5. Phase 6 (Public Evidence Pack report).

Reply with which phase to start on (or "all in order") and I'll begin implementation.
