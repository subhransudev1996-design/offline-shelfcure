# ShelfCure Sales — Release Checklist

A single page of everything you need to do before shipping the field-sales mobile app
and the admin dashboard to production. Pair this with
[SALES-CRM-IMPLEMENTATION-PLAN.md](SALES-CRM-IMPLEMENTATION-PLAN.md).

---

## 1. Database — run every migration in order

In Supabase SQL Editor, in this order, paste each file's contents and run.
Every script is **additive and re-runnable**, so re-running is safe.

1. [supabase_fix_user_settings.sql](supabase_fix_user_settings.sql) — required, fixes the
   pre-existing `handle_new_user_settings` trigger.
2. [supabase_sales_profiles.sql](supabase_sales_profiles.sql) — Phase 1, employee roles.
3. [supabase_sales_leads_extend.sql](supabase_sales_leads_extend.sql) — Phase 2, lead schema extension.
4. [supabase_sales_visits.sql](supabase_sales_visits.sql) — Phase 4, GPS visits.
5. [supabase_sales_demos.sql](supabase_sales_demos.sql) — Phase 5, demos.
6. [supabase_sales_trials.sql](supabase_sales_trials.sql) — Phase 5, trials.
7. [supabase_sales_timeline.sql](supabase_sales_timeline.sql) — Phase 6, timeline + notifications.

Then run [supabase_sales_rls_audit.sql](supabase_sales_rls_audit.sql) one query at a
time to verify:
- every table shows `rls_enabled = true`
- every table has a `Service role full access` policy
- `sales_profiles`, `lead_visits`, `notifications` also have user-scoped read policies
- `lead_timeline` has no `authenticated` read policy — sales staff read it only via
  the `/api/sales/timeline/:leadId` route, which re-checks lead access first

---

## 2. Environment variables (`web/.env.local`)

These already exist; confirm none are placeholders:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — same key as Android; needs **Maps JavaScript API** enabled.
- `RAZORPAY_*`, `RESEND_API_KEY`, etc. (existing app concerns — unchanged by this project)

For production deploys, mirror these in your hosting provider's secret store.

---

## 3. Google Maps API key — restrict properly

The same key is used by the mobile app and the admin map.

In Google Cloud Console for the key:

- **Enable APIs:**
  - Maps SDK for Android (mobile)
  - Maps JavaScript API (admin map)
- **Application restrictions** — split if needed, or use a single key with both:
  - HTTP referrers: your production domain and `localhost:3000/*` for dev.
  - Android apps: package `com.example.sales_mobile` (or your final
    application ID — see step 5) + your debug + release SHA-1 fingerprints.
    Get the SHA-1 with:
    ```
    cd sales-mobile/android && ./gradlew signingReport
    ```

---

## 4. Sales accounts & role enforcement

- Create at least one **admin** Supabase Auth user (or keep using the existing one) —
  any user **without** a `sales_profiles` row is treated as a legacy admin.
- Use **/admin/sales/employees** to create `field_sales` and `demo_team` accounts.
  Each one gets a `sales_profiles` row automatically.
- Verify: signing into `/admin-login` as a `field_sales` account redirects to
  `/admin-login?error=no_access`. (The middleware's role gate is what enforces this.)

---

## 5. Mobile app — application ID (optional but recommended)

The default Flutter package is `com.example.sales_mobile`. For an internal
production app you'll want a real reverse-DNS ID like `com.shelfcure.sales`.

If you change it (4 files):

1. `sales-mobile/android/app/build.gradle.kts` — both `namespace` and
   `applicationId`.
2. Move `android/app/src/main/kotlin/com/example/sales_mobile/MainActivity.kt`
   to `com/shelfcure/sales/MainActivity.kt` and update its `package` declaration.
3. `flutter clean && flutter pub get` from `sales-mobile/`.
4. **Update the Google Maps API key restriction** — change the registered
   package + SHA-1 in Google Cloud Console to match.

---

## 6. Mobile app — release signing

1. Generate an upload keystore (one-time):
   ```
   keytool -genkey -v -keystore upload-keystore.jks \
           -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
   **Save the .jks and its passwords somewhere safe.** Losing them blocks every
   future Play Store update.
2. Copy [sales-mobile/android/key.properties.example](sales-mobile/android/key.properties.example)
   to `sales-mobile/android/key.properties` and fill it in. (Already gitignored.)
3. Build an Android App Bundle:
   ```
   cd sales-mobile
   flutter build appbundle --release \
       --dart-define=API_BASE=https://your-production-domain.com
   ```
   The bundle ends up at `build/app/outputs/bundle/release/app-release.aab`.
4. For a quick on-device APK test:
   ```
   flutter build apk --release \
       --dart-define=API_BASE=https://your-production-domain.com
   ```

If `key.properties` is absent the release build falls back to the debug
keystore — fine for `flutter run --release` during development, not fine for
Play Store uploads.

---

## 7. End-to-end test pass

Test these once against your production Supabase + a real Android device.

### Admin web
- [ ] Sign in at `/admin-login` as an admin.
- [ ] Create a `field_sales` employee at `/admin/sales/employees`.
- [ ] Create a lead at `/admin/leads`, assign it to that employee.
- [ ] Receive a notification on the mobile (next step) confirms the assign-flow.
- [ ] `/admin/sales/visits`, `/admin/sales/map`, `/admin/sales/reports` all load.
- [ ] Convert a lead → ends up at `/admin/licenses/[key]`.
- [ ] Try signing in as the field_sales account — get bounced from `/admin`.

### Mobile
- [ ] Sign in with the field_sales credentials.
- [ ] My Leads → the assigned lead is visible.
- [ ] Open lead → **Check In** (GPS permission flow), pin saves, timer runs.
- [ ] **Check Out** with a note — timeline shows the visit.
- [ ] **Log Follow-up** → appears in timeline within ~1 s.
- [ ] **Schedule Demo** for the demo_team employee — demo appears + notification fires for the conductor.
- [ ] Sign in as that demo_team user → My Demos → Mark Complete with feedback.
- [ ] **Start Trial** → status auto-bumps to `trial_activated`; **Trial Used** increments login_count.
- [ ] **Voice Note**: tap mic, speak, stop, save — transcript appears in timeline.
- [ ] Map screen shows the pinned lead with status colour.
- [ ] Notifications screen shows unread badge → tap → marks read.

---

## 8. Things deliberately deferred (post-release)

These are PRD items not built in v1; track them as a follow-up backlog:

- **Push notifications (FCM).** Currently in-app only; the `notifications` table
  is ready, FCM tokens can be added later.
- **AI lead scoring / smart recommendations** (PRD §22).
- **Territory hierarchy / multi-city** (PRD §22).
- **Distributor / franchise modules** (PRD §22).
- **Admin pharmacy-intelligence + competitor field editors** — the columns exist
  and the mobile app captures them; admin-side editing is read-only today.
- **Lost-reason capture from mobile** — UI not exposed yet; the API accepts it.
- **Offline-first** — explicitly excluded by PRD §5.

---

_Last updated: 2026-05-15._
