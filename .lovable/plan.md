# Goals × Agreement Categories × Bookings × Visits × Reports

Tie NDIS goals to a funding agreement's categories, allow staff to attach goals to a booking, then carry those selections through to the visit so they drive note drafting, evidence, and a downstream report for the Support Coordinator / NDIA.

## What this gives you

- When creating an agreement, optionally tag each category with one or more participant goals (or create new ones inline). Not mandatory.
- When booking, after picking a participant + category, the form shows the goals linked to that category as checkboxes — tick the ones the visit will work on.
- Those goal selections become pre-populated, scored "goal contributions" on the visit (today they're free-form per visit). Staff just confirm, rate, and add a note.
- The AI note drafter already uses goal contributions; with goals pre-selected the draft becomes far more on-target.
- A new "Support Coordinator report" per participant aggregates: goals → linked visits → contribution notes/ratings → spend per category, exportable as a shareable PDF/HTML pack (same evidence-pack pattern we use for invoices).

## Data model changes

Two new tables, one new column. Both strictly tenant-scoped via `org_id`.

```text
funding_agreement_category_goals       -- goals tagged to an agreement category (M:N)
  id uuid pk
  org_id text
  agreement_category_id uuid -> funding_agreement_categories.id (cascade delete)
  goal_id uuid -> participant_goals.id (cascade delete)
  unique (agreement_category_id, goal_id)

booking_goals                          -- goals selected when booking (M:N)
  id uuid pk
  org_id text
  booking_id uuid -> bookings.id (cascade delete)
  goal_id uuid -> participant_goals.id (cascade delete)
  unique (booking_id, goal_id)
```

Trigger: when a `visit` is inserted from a booking, copy any `booking_goals` rows into `visit_goal_contributions` as empty rows (no rating, no note) so the evidence panel auto-shows them. We already have the visit-from-booking insert in `useCreateBooking`; the simplest path is a Postgres trigger on `visits` AFTER INSERT that reads `booking_goals` for `NEW.booking_id`.

## UI changes

1. **Funding agreement dialog** — under each category row, a "Linked goals" multi-select (uses participant's existing goals; "+ New goal" inline opens the goal editor). Stored to `funding_agreement_category_goals`.
2. **Participant Goals tab** — show, per goal, which agreement category it's tagged to (badge).
3. **Booking drawer** — once participant + category are chosen, render a "Goals worked on this visit" checkbox list sourced from goals linked to the chosen agreement category (fall back to all active participant goals when none are linked, with a hint "Tip: link goals to the category in the agreement"). Selections persist as `booking_goals`.
4. **Visit detail / Evidence panel** — pre-seeded contribution rows for each booking-selected goal; staff just rate + note. Existing UI works as-is.
5. **AI visit note edge function** — already pulls `visit_goal_contributions`; no change needed, but the prompt will include goal title + outcome domain so drafts cite them.
6. **New "Support Coordinator report" page** at `/participants/:id/coord-report?from=…&to=…`:
   - Header: participant, plan period, agreement summary.
   - For each goal: linked category, # visits attributed, total hours, avg rating, latest 5 contribution notes.
   - For each agreement category: budget vs spend in window.
   - "Export" button → calls a new edge function `coordinator-report` that returns HTML (printable / save-as-PDF in browser). Same shareable token pattern as `evidence-pack`.

## Backend

- Migration adds the two tables + trigger + RLS policies (mirror existing `Allow all` style pending Clerk RLS rollout).
- New edge function `coordinator-report` (read-only): validates org membership, builds the aggregated payload, optionally returns a public-token shareable HTML page like `evidence-pack`.

## Out of scope / not changed

- No mandatory goal linkage — agreements still save with zero goals attached.
- No changes to invoice generation, billing categories, or claim export.
- Existing `participant_goals` schema and existing per-visit goal contribution table both stay; we're only adding linkage tables.

## Build order

1. Migration (tables + trigger + indexes).
2. Hook layer (`useAgreementCategoryGoals`, `useBookingGoals`).
3. Funding dialog: linked-goals multi-select.
4. Booking drawer: goals checkbox list driven by selected category.
5. Coordinator report page + edge function + share token.
6. Smoke test end-to-end with one participant.
