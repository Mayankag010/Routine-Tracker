# Routine Tracker

**Step 1:** project scaffold, Tailwind design tokens, full login / signup /
forgot-password flow wired to Firebase Auth.

**Step 2:** routines CRUD and the real daily checklist —
- `/routines` — add, edit, delete routines with a name, a color (preset
  swatches or a custom hex picker), and a schedule (daily / weekdays /
  weekends / custom days)
- `/dashboard` — shows only the routines scheduled for today, with a tap-to
  tick checkbox that writes straight to Firestore in real time
- A shared app shell: sidebar nav on desktop, bottom tab bar on mobile

**Step 3:** the Calendar page —
- A past-7-days strip with a dot under each day showing whether it was
  fully done, partially done, or missed
- A month grid you can navigate month to month, same dot indicators, future
  days disabled
- Tapping any day (past or today) shows that day's routines below, with the
  same tick checkboxes — so you can back-fill or correct a day you forgot

**Step 4:** the Analytics page —
- A completion-rate area chart (Recharts) over 30 days / 90 days / 6 months,
  showing the % of scheduled routines completed each day
- A streak list per routine: current streak and best streak in the selected
  range, with a flame icon when a routine is currently on a streak

**Step 5 (this update):** offline support —
- Firestore's on-device cache is turned on, so pages you've already opened
  keep working with no connection, and ticking a routine offline queues the
  write and syncs automatically the moment you're back online — no custom
  sync code needed, Firestore does this natively
- The service worker now caches the app shell, fonts, and static assets for
  offline use, with a dedicated `/offline` page for the rare case you open
  a page that was never cached
- A small offline banner appears in the app whenever you lose connection

## 1. Install dependencies

```
npm install
```

## 2. Create a Firebase project

1. Go to https://console.firebase.google.com and create a new project.
2. In the project, go to **Build → Authentication → Get started**, and
   enable the **Email/Password** sign-in method.
3. Go to **Build → Firestore Database → Create database** (start in
   production mode; the rules file below locks it down).
4. Go to **Project settings → General → Your apps**, click the web icon
   (`</>`) to register a web app, and copy the config values shown.

## 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and paste in the values from step 2:

```
cp .env.local.example .env.local
```

## 4. Deploy the Firestore security rules

The `firestore.rules` file makes sure a user can only read/write their own
routines and completions. Paste its contents into
**Firestore Database → Rules** in the Firebase console and publish, or use
the Firebase CLI (`firebase deploy --only firestore:rules`) if you have a
Firebase project linked locally.

## 5. Run it

```
npm run dev
```

Visit `http://localhost:3000`. You should be able to:
- Add a couple of routines with different schedules
- On `/dashboard`, tick a few off for today
- Go to `/calendar` — see today highlighted in the week strip and month
  grid with a gold dot (fully done) or grey dot (partial)
- Tap a past day and tick/untick a routine for that day — the dot on the
  calendar should update live
- Confirm future days in the month grid are disabled (can't tick ahead)
- Go to `/analytics`, switch between 30/90/180-day ranges, and see the
  completion chart and streak numbers update

## Testing offline support

The service worker is **disabled in dev mode** (`npm run dev`) by design —
that's normal for Next.js PWAs, since it would otherwise cache your own
in-progress changes. To actually test offline behavior, build for
production:

```
npm run build
npm run start
```

Then, in Chrome DevTools → Network tab, switch "No throttling" to
"Offline", and:
- Navigate between pages you've already visited — they should still load
- Tick a routine — it should tick instantly and the offline banner should
  say it'll sync later
- Switch back to "Online" — within a moment, refresh on another
  device/browser and confirm the tick made it to Firestore

## App is complete

All five original build steps are done: auth, routines, daily tracking,
calendar, analytics, and offline support.

**Analytics upgrade:** the Analytics page now has four parts —
- **Summary cards**: today's completion, weekly average, active days this
  month, habits tracked — all calculated live, never hardcoded
- **Today**: an animated circular progress ring for today's completion
- **Weekly Performance**: a bar chart of the last 7 days with hover
  tooltips (date, completed/total, percentage)
- **Monthly Activity**: a heatmap for the *current month only* (not a
  yearly GitHub-style graph) — Monday-start grid, color intensity by daily
  completion %, hover for exact numbers, month navigation that can't go
  past the current month, plus the streak list underneath

**Per-activity streaks (this update):**
- Every routine on the **Dashboard** checklist now shows its own streak
  right under its name — e.g. "🔥 12 days streak", or "🔥 11 days —
  complete today to reach 12" if you haven't ticked it yet today, or
  "Streak lost — complete today to start again" if yesterday broke it
- The **Routines** list shows 🔥 current and 🏆 best streak for every
  routine at a glance
- These are genuinely independent per routine — a missed day on one
  routine doesn't touch any other routine's streak
- Still schedule-aware: a day the routine wasn't scheduled on doesn't
  break the streak, only a scheduled-and-missed day does
- Ticking a forgotten routine from the calendar/date-details drawer
  recalculates the real streak from actual history the next time you view
  it — nothing is incremented by guesswork
- No extra cost: reuses the same one-range-query-per-routine pattern as
  everywhere else, not a query per day

(The overall "everything completed" streak banner from the previous
update is unchanged and still sits at the top of the Dashboard —
this adds independent per-routine streaks alongside it.)

**Late/historical completion:**
- Click any past or current date on the **Monthly Activity** heatmap and a
  details panel opens — right-side drawer on desktop, bottom sheet on
  mobile — without leaving the page
- Shows the date, "X of Y completed", a progress bar, and every routine
  that was actually scheduled *and already existed* on that date, each with
  a checkbox
- Ticking/unticking writes the completion to that exact historical date
  (never today's date), and the heatmap, weekly chart, and stat cards all
  update live since they're already subscribed to that data — no manual
  refresh wiring needed
- Future dates are blocked from editing with a clear message
- Empty days show "No routines scheduled" instead of a blank panel; a
  failed read shows a retry button per row

**Known limitation (by design, flagged rather than silently wrong):** a
routine's *current* schedule and color are what's shown for historical
dates — if you later edit a routine's schedule, that edit applies
retroactively when looking back at old dates too. Only the routine's
*creation date* is respected (a habit added today won't show as "missed"
on days before it existed). Tracking full schedule-change history would be
a bigger data-model change — let me know if you want that built.

From here it's just refinements — let me know if you want anything added,
changed, or polished (e.g. deploying to Vercel, or new features).

---

## Settings system (new)

A full Settings area now lives at `/settings` (linked from the sidebar on
desktop and the bottom tab bar on mobile): Profile, Appearance,
Notifications, Reminders, Routine Preferences, Data & Privacy, Security,
and About.

**What's real, not just UI:**
- **Dark / Light / System theme + custom accent color** — implemented via
  CSS variables (`src/app/globals.css`, `tailwind.config.js`), so it applies
  across buttons, charts, the calendar heatmap, streak indicators, and
  focus rings without touching every component individually. A
  pre-hydration script avoids a flash of the wrong theme.
- **Reminders** are stored in a new `reminders` Firestore collection
  (`src/lib/reminders.js`) and actually scheduled client-side
  (`src/components/NotificationScheduler.jsx`), which also handles smart
  "don't forget" nudges, streak-risk warnings, achievement milestones, and
  daily/weekly summaries — all deduplicated so nothing repeats or spams.
- **Data export** (JSON or CSV), **clear completion history**, and
  **delete account** are fully wired to Firestore/Firebase Auth, with
  password reauthentication required for the destructive ones.
- **New Firestore collections**: `userPreferences/{uid}` and `reminders`.
  `firestore.rules` has been updated — redeploy the rules
  (`firebase deploy --only firestore:rules`) after pulling this update.

**Known limitation, flagged rather than hidden:** this is a client-only PWA
with no push server, so notifications only fire while the app is open in a
tab — they won't wake up the browser when it's fully closed. Adding true
background push would mean adding a backend (Cloud Functions + FCM), which
felt like a bigger architectural change than this update should make on its
own — happy to build that next if you want it.

"Goal notifications" is a real, saved preference already wired into the
scheduler — it just has nothing to fire on yet, since the app doesn't have
a Goals feature. It'll start working the moment one exists.

"Week starts on" and "Date format" preferences are stored and available via
`src/lib/date-format.js`, but not yet threaded through every date display
(Calendar view, month grid) — only applied where used in Settings itself —
to avoid rewriting those existing views as part of this change.
