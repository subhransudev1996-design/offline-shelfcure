# ShelfCure Sales CRM & Field Visit Intelligence — Implementation Plan

> Master tracking document. Source of truth: `mobile-app.md` (PRD).
> Update the checkboxes as work progresses. Each phase is independently shippable
> and **must not break anything already running in production**.

---

## 0. Scope Summary

Two surfaces, one backend:

| Surface | Who | Where |
|---|---|---|
| **Android app** (`sales-mobile/`) | Field Sales Executives + Demo Team | Flutter, scaffolded ✅ |
| **Admin panel** (`/admin/*`) | Management | Existing Next.js app — extended, not rewritten |
| **Backend** | both | Existing Next.js + Supabase project |

---

## 1. Current State Audit (verified against the codebase)

### What already exists and works — DO NOT BREAK
- `leads` + `lead_followups` tables (`supabase_leads.sql`).
- Admin Leads pages: `app/admin/leads/page.tsx`, `[id]`, `LeadsTable.tsx`, `AddLeadModal.tsx`.
- Lead API routes: `app/api/admin/leads/{create,update,delete,convert,add-followup,delete-followup}`.
- `app/api/mobile/*` routes — **these belong to the desktop SCANNER app** (license-key auth). Unrelated to this project. **Leave untouched.**
- Admin auth: `middleware.ts` guards `/admin/*` via Supabase Auth. ⚠️ It only checks *logged in*, not *role* — see Phase 1.
- Lead statuses in use: `new, contacted, interested, demo_done, negotiating, converted, lost`.
- Followup types: `call, whatsapp, visit, email, demo`.

### Gaps vs PRD
1. No employee identity / role system (admin vs field_sales vs demo_team).
2. `leads` missing: `assigned_to`, GPS, `whatsapp_number`, `priority_score`, `lost_reason`, pharmacy-intelligence fields, competitor fields.
3. Lead stages narrower than PRD (PRD adds: follow-up pending, call not picked, visit planned, demo scheduled, trial activated, payment pending, future opportunity).
4. No `visits` table (GPS check-in/check-out).
5. No `demos` table.
6. No lead-level trial tracking (pre-conversion).
7. No `voice notes`, no `activity timeline`, no `notifications`.
8. No authentication API for the mobile sales app.
9. Admin panel has no map dashboard / employee monitoring / heatmap.

---

## 2. Non-Breaking Guarantees (hard rules)

- **DB migrations are additive only.** Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. No renames, no drops, no type changes to existing columns. Every migration script is re-runnable.
- **New API routes live under `/api/sales/*`.** Never reuse or modify `/api/mobile/*` (scanner app) or `/api/admin/leads/*` (admin UI).
- **Existing lead statuses stay valid.** New stages are *added* to the allowed set; the old 7 keep working.
- **Existing admin pages keep rendering.** New columns are nullable so current queries (`select(...)`) are unaffected.
- **The Flutter app is fully isolated** in `sales-mobile/` — it cannot affect the web build.
- After every phase: run `next build` and confirm the admin panel still loads.

---

## 3. Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Mobile auth | **Supabase Auth** (email/password) + `sales_profiles` table with `role` | Reuses existing infra; Flutter uses `supabase_flutter` SDK |
| Mobile data access | Flutter → Supabase directly (PostgREST) for reads, with **RLS**; Next.js `/api/sales/*` for complex writes (conversion, demo assignment) | Minimal new backend code; RLS enforces "see only assigned leads" |
| Role enforcement | `sales_profiles.role` ∈ `admin \| field_sales \| demo_team`; RLS policies per role | One identity model for web + mobile |
| Maps | **Google Maps** (`google_maps_flutter`) — API key stored in env as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / Flutter manifest | Key provided; must be restricted to app package + Maps SDK in GCP console |
| Voice notes | **On-device speech-to-text** via Flutter `speech_to_text` plugin — transcribe live, save **text only** to Supabase | No audio upload, no external API, instant for time-pressed sales staff |
| Lead conversion | Allowed from **both** admin panel and the mobile app (field sales) | Per stakeholder decision |
| Offline | **Out of scope** (PRD §5 excludes offline-first) | Online-only; show clear network errors |
| Notifications | In-app only (PRD §16) — polled from a `notifications` table | No FCM in v1 |

---

## 4. Database Plan

All scripts go in the web root as `supabase_sales_*.sql`, re-runnable, run manually in Supabase SQL editor.

### `supabase_sales_profiles.sql`
- `sales_profiles` (id = auth.users.id, full_name, phone, role, is_active, created_at).
- RLS: user reads own row; `admin` role reads all.

### `supabase_sales_leads_extend.sql` — extends existing `leads`
`ADD COLUMN IF NOT EXISTS`:
`assigned_to UUID`, `whatsapp_number TEXT`, `gps_lat DOUBLE PRECISION`, `gps_lng DOUBLE PRECISION`,
`priority_score INT DEFAULT 0`, `lost_reason TEXT`,
pharmacy intel: `existing_software TEXT`, `monthly_billing_volume TEXT`, `staff_count INT`,
`has_computer BOOLEAN`, `has_internet BOOLEAN`, `drug_license_no TEXT`, `gst_number TEXT`,
competitor: `competitor_name TEXT`, `competitor_satisfaction TEXT`, `competitor_renewal_period TEXT`, `competitor_pain_points TEXT`.
- Add expanded statuses to API validators (not a DB constraint — column is free `TEXT`).

### `supabase_sales_visits.sql`
- `lead_visits` (id, lead_id, sales_user_id, check_in_at, check_out_at, check_in_lat/lng, check_out_lat/lng, duration_seconds, notes, created_at).

### `supabase_sales_demos.sql`
- `lead_demos` (id, lead_id, scheduled_at, conducted_by, status, duration_minutes, notes, questions_asked, interest_level, conversion_probability, created_at).

### `supabase_sales_trials.sql`
- `lead_trials` (id, lead_id, start_date, expiry_date, last_active_date, login_count, conversion_probability, notes).

### `supabase_sales_timeline.sql`
- `lead_timeline` (id, lead_id, actor_id, event_type, payload JSONB, created_at) — append-only activity log.
- `lead_voice_notes` (id, lead_id, sales_user_id, storage_path, transcript, duration_seconds, created_at).
- `notifications` (id, user_id, kind, title, body, lead_id, is_read, created_at).

### RLS summary
- `field_sales`: SELECT/UPDATE leads where `assigned_to = auth.uid()`; INSERT own visits/followups/voice notes.
- `demo_team`: SELECT/UPDATE demos assigned to them.
- `admin`: full access (service role already bypasses RLS for admin API).

---

## 5. Backend / API Plan (`/api/sales/*` — all new)

| Route | Method | Purpose |
|---|---|---|
| `/api/sales/auth/me` | GET | Return profile + role for a Supabase JWT |
| `/api/sales/leads` | GET/POST | List assigned leads / create lead (with GPS) |
| `/api/sales/leads/[id]` | GET/PATCH | Detail / update status, intel, lost reason |
| `/api/sales/leads/[id]/followup` | POST | Add follow-up |
| `/api/sales/visits/check-in` | POST | Start visit (GPS validated) |
| `/api/sales/visits/check-out` | POST | End visit, compute duration |
| `/api/sales/demos` | GET/POST/PATCH | Demo schedule + feedback |
| `/api/sales/voice-notes` | POST | Register an uploaded voice note |
| `/api/sales/nearby` | GET | Leads within radius of lat/lng (500m/1km) |
| `/api/sales/notifications` | GET/PATCH | List / mark read |
| `/api/sales/timeline/[leadId]` | GET | Activity timeline |

- Each route validates the Bearer JWT via Supabase, resolves `sales_profiles`, enforces role.
- Conversion reuses logic from `app/api/admin/leads/convert/route.ts` — extracted into `lib/leads/convert.ts` so both admin and sales call the same code (no duplication, no behavior change).

---

## 6. Flutter App Plan (`sales-mobile/`)

Package: `sales_mobile`. Suggested dependencies (added in their own phase):
`supabase_flutter`, `google_maps_flutter`, `geolocator`, `flutter_riverpod` (or `provider`),
`go_router`, `record` + `path_provider` (voice), `intl`.

### Screen map
- **Auth:** Login → role-based home.
- **Field Sales home:** Dashboard (today/overdue follow-ups, nearby leads, demo schedule, hot leads, visit count).
- **Leads:** list + filters/search → Lead detail (timeline, intel, competitor, status changer).
- **Visit flow:** Check-in (GPS) → timer → notes/voice → check-out.
- **Map:** pharmacy pins, color markers (PRD §8 colors), nearby radius, route grouping.
- **Demo Team home:** assigned demos → demo feedback form.
- **Notifications center.**
- **Lead creation form** with pharmacy-intelligence fields + GPS capture.

---

## 7. Admin Panel Enhancements (`/admin/*` — extend only)

- New nav item **Field Sales** with sub-pages: Employees, Visits, Map Dashboard, Sales Reports.
- `/admin/sales/employees` — create/manage sales accounts (Supabase Auth user + `sales_profiles` row), assign leads.
- `/admin/sales/map` — Google Maps: employee locations, visit pins, conversion heatmap.
- `/admin/sales/visits` — daily visit log + employee productivity.
- Extend Leads detail page to show: assigned employee, visits, demos, timeline.
- Harden `middleware.ts`: block `field_sales`/`demo_team` roles from `/admin/*` (currently any authenticated user passes).

---

## 8. Phased Roadmap (monitor here)

### Phase 0 — Scaffold ✅
- [x] Create `sales-mobile/` Flutter Android project.
- [x] Write this plan.

### Phase 1 — Identity & Roles (backend) ✅
- [x] `supabase_sales_profiles.sql` + RLS.
- [x] Harden `middleware.ts` with role check (legacy admins with no profile still pass).
- [x] `/admin/sales/employees` page — create/manage sales users (+ "Sales Team" nav item).
- [x] `/api/admin/sales/employees` (GET/POST) + `/update` route.
- [x] `/api/sales/auth/me`.
- [x] Verify: `next build` passes; admin panel unaffected.
- [ ] **ACTION REQUIRED:** run `supabase_sales_profiles.sql` in the Supabase SQL editor.

### Phase 2 — Lead Schema Extension ✅
- [x] `supabase_sales_leads_extend.sql` (additive — assignment, geo, intel, competitor cols).
- [x] Shared `lib/leads/constants.ts` — full 14-stage lifecycle + lost reasons.
- [x] Extended `update` + `add-followup` route validators to the full status set.
- [x] `/api/admin/leads/assign` route + "Assigned To" dropdown on lead detail page.
- [x] Verify: `next build` passes; existing Leads pages unaffected.
- [ ] **ACTION REQUIRED:** run `supabase_sales_leads_extend.sql` in the Supabase SQL editor.

### Phase 3 — Mobile Foundation ✅
- [x] Flutter deps (`supabase_flutter`, `http`, `intl`), Android INTERNET permission.
- [x] `lib/sales/auth.ts` — shared JWT auth for all `/api/sales/*` routes.
- [x] `/api/sales/leads` GET — assigned leads (admin sees all) + nested follow-ups.
- [x] Flutter app: Supabase init, `AuthGate`, login screen, home (role-aware).
- [x] Leads list (search + pull-to-refresh) + read-only lead detail with timeline.
- [x] Verify: `flutter analyze` clean; `next build` passes.
- [ ] **TEST:** run `next dev`, then `flutter run` (emulator → API base `10.0.2.2:3000`).
      Sign in as a `field_sales` employee that has leads assigned.

### Phase 4 — Geo Visit Intelligence ✅
- [x] `supabase_sales_visits.sql` (with partial index on the user's open visit).
- [x] `lib/sales/geo.ts` haversine helper + 150 m check-in radius constant.
- [x] `/api/sales/visits/check-in` (one-open-at-a-time guard, auto-pins lead on first visit, distance-from-pin computed).
- [x] `/api/sales/visits/check-out` (duration, optional GPS + notes).
- [x] `/api/sales/visits/active` and `/api/sales/nearby`.
- [x] Flutter: `geolocator` + `google_maps_flutter`, Android permissions, Maps key wired via `local.properties` (not committed).
- [x] Lead detail: live check-in / running-timer / check-out flow.
- [x] Map screen: assigned leads as PRD-coloured pins, my-location, auto-fit.
- [x] Verify: `flutter analyze` clean; `next build` passes.
- [ ] **ACTION REQUIRED:** run `supabase_sales_visits.sql` in the Supabase SQL editor.
- [ ] **GCP CONSOLE:** restrict the Google Maps key to your Android app's package
      (`com.example.sales_mobile`) + SHA-1, and enable the **Maps SDK for Android**.

### Phase 5 — Follow-up, Demo, Trial ✅
- [x] `supabase_sales_demos.sql` (with status CHECK + RLS for conductors).
- [x] `supabase_sales_trials.sql` (one trial per lead, lifecycle dates + login_count).
- [x] `lib/leads/priority.ts` — score 0..100 from status / follow-up timing / demo / trial signals; `recomputePriority()` invoked on every write.
- [x] `/api/sales/leads/:id/followup` POST (mobile follow-up logging).
- [x] `/api/sales/demos` GET/POST + `/api/sales/demos/:id` PATCH (schedule + complete).
- [x] `/api/sales/trials` POST (upsert + `mark_used` shortcut).
- [x] `/api/sales/employees` GET (active sales staff for the "Conducted by" picker).
- [x] `/api/sales/leads` now nests `lead_demos` + `lead_trials` for the detail screen.
- [x] Flutter: Demo + Trial + Employee models, sales_api methods, quick-action strip on lead detail (Follow-up / Demo / Trial), demos + trial sections, dedicated **My Demos** screen.
- [x] Verify: `flutter analyze` clean; `next build` passes.
- [ ] **ACTION REQUIRED:** run `supabase_sales_demos.sql` and `supabase_sales_trials.sql` in the Supabase SQL editor.

### Phase 6 — Timeline, Voice Notes, Notifications ✅
- [x] `supabase_sales_timeline.sql` — `lead_timeline` + `notifications` tables + RLS.
      (No Storage bucket — voice notes are on-device transcribed to text; no audio uploaded.)
- [x] `lib/leads/events.ts` — `recordEvent()` + `pushNotification()` helpers.
- [x] Timeline wired into follow-up, demo (schedule + complete), trial (start/used/updated),
      visit (check-in/out), admin lead-assign.
- [x] Push notifications on: demo assigned to someone other than the scheduler,
      and admin assigning a lead to a sales user.
- [x] `/api/sales/voice-notes` POST (transcript-only) + `/api/sales/timeline/[leadId]` GET
      + `/api/sales/notifications` GET/PATCH.
- [x] Flutter: `speech_to_text` plugin, RECORD_AUDIO permission, RecognitionService query.
- [x] `SpeechService`, `VoiceNoteSheet` (live transcript, edit-before-save), Voice Note
      added to the lead-detail quick-actions row.
- [x] Lead detail's "Activity Timeline" replaced by the unified server-driven feed
      (color-coded icons per event type).
- [x] Notifications screen + unread badge on the home app-bar bell.
- [x] Verify: `flutter analyze` clean; `next build` passes.
- [ ] **ACTION REQUIRED:** run `supabase_sales_timeline.sql` in the Supabase SQL editor.

### Phase 7 — Admin Intelligence ✅
- [x] `/admin/sales/visits` — visit log table + today's-top-performers leaderboard.
- [x] `/admin/sales/map` — Google Maps with status-coloured pins, visit markers (toggle), conversion heatmap (toggle), legend, info windows linking to leads.
- [x] `/admin/sales/reports` — 10 KPI cards (total / active / converted / conv % / demo→conv / trial→conv / lost / completed demos / active trials / avg cycle), pipeline bar chart, employee leaderboard, source breakdown, lost-reason breakdown, top-cities table.
- [x] Three new nav items added to `AdminShell`.
- [x] Google Maps API key in `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (gitignored).
- [x] Verify: `next build` passes; all four `/admin/sales/*` pages compile.
- [ ] **GCP CONSOLE:** enable **Maps JavaScript API** for the key (Android-only restriction won't work for the web map). Add HTTP referrer restriction for your domain.

### Phase 8 — Hardening & Release ✅
- [x] `supabase_sales_rls_audit.sql` — verification script for RLS state, policies, row counts.
- [x] Android release-signing scaffolding: `build.gradle.kts` reads optional `key.properties`,
      falls back to debug keystore when absent so `flutter run --release` keeps working.
- [x] `sales-mobile/android/key.properties.example` template (real `key.properties` already gitignored).
- [x] [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md) — single-page operator runbook
      (migrations, env vars, Maps key restriction, sales accounts, optional app-id rename,
      release signing, end-to-end test pass, deliberately-deferred backlog).
- [x] Final `flutter analyze` clean, final `next build` clean.

---

_Build status: **All 8 phases complete.** Ship using [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md)._

---

## 9. Resolved Decisions & Remaining Questions

Resolved:
- ✅ Google Maps API key provided → stored as env var, **not** hardcoded.
- ✅ Lead conversion: both admin and field sales.
- ✅ Voice-to-text: `speech_to_text` plugin, on-device, text-only persisted.

Still open (needed before Phase 4):
1. **GPS validation radius** for check-in — how far from the saved pharmacy pin counts as "valid"? (default proposal: 150 m)
2. Confirm tables are added to the **same Supabase project** the web app uses.

---

_Last updated: 2026-05-15 · Phase 0 complete, Phase 1 in progress._
