# Project Requirement Document (PRD)
## TerraGuard Companion App — Software Module (v1 / Local Development Scope)

**Prepared for:** Software/App development workstream of the TerraGuard project
**Status:** Draft for local prototype — not a deployment/production spec
**Related hardware source:** TerraGuard soil lead detection device (see "Technology and Prototype" document)

---

## 1. Purpose

This document specifies the software requirements for the TerraGuard companion application module covering exactly the following features, to be built and run entirely on **localhost with a local MySQL database**:

1. Login
2. Signup
3. Notification / Alert
4. Photo display (soil test reaction image)
5. Remediation on/off status
6. Days of remediation (tracking)
7. Heatmap generation

No other feature is in scope for this version. Deployment, hosting, real hardware/device integration, and payment/commercial features are explicitly **out of scope**.

---

## 2. Technology Stack (confirmed, no unknowns introduced)

| Layer | Technology |
|---|---|
| Frontend UI/Styling | HTML, Tailwind CSS |
| Frontend Framework | React + JavaScript |
| Backend Framework | Python, FastAPI |
| Database | MySQL (local instance) |
| Mapping/Heatmap library | A JavaScript mapping library compatible with React (e.g. Leaflet via a React wrapper) — used only for rendering the heatmap feature; no new backend language introduced |
| Environment/config | `.env` file(s) for secrets (DB credentials, JWT secret key) |
| Version control hygiene | `.gitignore` to exclude secrets and local artifacts |

All chosen technologies match the developer's existing, stated skillset. No unfamiliar languages are introduced.

---

## 3. Assumptions (Confirmed)

The following assumptions were reviewed and **confirmed correct** by the project owner. They are treated as settled requirements for this version, not open questions:

- **A1 — Data source for tests:** Test records (photo, estimated concentration, risk level, GPS coordinates) will be **manually entered or seeded as sample/mock data** — not received live from hardware.
- **A2 — "Notification/Alert":** In-app notifications only (no push, SMS, or email).
- **A3 — "Photo should be shown":** Displays an already-captured/uploaded image associated with a test record — not live in-app camera capture.
- **A4 — "Remediation on or off showing":** A per-test (or per-plot) boolean toggle stored in the database, editable by the user, shown as a clear status indicator.
- **A5 — "Days of remediation":** An open-ended elapsed-day counter from a recorded start date, recalculated on each view.
- **A6 — "Heat map generation":** A map plotting test records by GPS coordinate, color-intensity-coded by lead concentration/risk level, using manually entered coordinates.
- **A7 — Users/roles:** A single user role for v1 — no admin/farmer/NGO role hierarchy. Each user sees only their own records.
- **A8 — Multi-plot support:** Test records may optionally carry a plot/location label, but dedicated plot management is not in scope.

---

## 4. Feature Requirements

### 4.1 Signup
- User provides: name, email, password (and optionally a farm/location label).
- Backend validates uniqueness of email, hashes password before storing (never store plaintext passwords).
- On success, user is created in the `users` table and redirected to login (or auto-logged-in — implementer's choice, but must be consistent).

### 4.2 Login
- User provides email + password.
- Backend verifies credentials, issues a session token (JWT) on success.
- Frontend stores the token and attaches it to subsequent authenticated API requests.
- Invalid credentials must return a clear, non-revealing error (do not indicate whether the email or the password was wrong, individually).

### 4.3 Notification / Alert
- System stores notifications in a `notifications` table, linked to a user (and optionally a specific test record).
- Triggers for creating a notification (minimum): a new test result classified as **Moderate** or **High** risk; a remediation cycle reaching a defined day threshold (e.g., day 30, "time to re-test") — exact threshold configurable/hardcoded for v1.
- Frontend displays notifications as a list (e.g., under a bell icon/badge) with unread/read state.
- No SMS/push/email in this version (see Assumption A2).

### 4.4 Photo Display
- Each test record has an associated image file (the captured colorimetric reaction).
- Backend: images are stored on local disk (e.g., an `/uploads` directory) and served via a static file route; the database stores only the file path/reference, not the binary blob.
- Frontend: the image is displayed prominently on the test's detail card/view.
- Supported formats: JPEG/PNG at minimum.

### 4.5 Remediation On/Off
- Each test record (or plot) has a boolean field `remediation_active`.
- User can toggle this from the UI (e.g., a switch component).
- Toggling ON sets a `remediation_start_date` (current date/time) if not already set.
- Toggling OFF stops the day counter but should retain the historical start date (do not delete it) so the record of "how long remediation ran" is preserved.

### 4.6 Days of Remediation
- Displayed only when `remediation_active` is true (or as a completed total if turned off — see 4.5).
- Calculated as: `days_elapsed = current_date - remediation_start_date`.
- Recommend calculating this server-side (in the FastAPI response) rather than client-side, so the frontend simply displays the number without needing its own date logic duplicated across components.

### 4.7 Heatmap Generation
- A dedicated map view aggregates all of the logged-in user's test records that have GPS coordinates.
- Each point is plotted with intensity/color weighted by lead concentration (or risk level, if concentration is unavailable) — following the same Low/Moderate/High color convention as the rest of the app for consistency.
- Data source: the local MySQL `soil_tests` table, queried via a backend endpoint (e.g., `GET /tests/heatmap-data`) that returns `[{lat, lng, intensity}]`-shaped data for the frontend map library to consume.
- Since live GPS data isn't available yet, test records must allow **manual entry of latitude/longitude** for now.

---

## 5. Data Model (indicative — local MySQL)

**`users`**
`id (PK), name, email (unique), password_hash, created_at`

**`soil_tests`**
`id (PK), user_id (FK → users.id), plot_label, latitude, longitude, photo_path, lead_concentration, risk_level (enum: low/moderate/high), remediation_active (bool), remediation_start_date (nullable datetime), tested_at, created_at`

**`notifications`**
`id (PK), user_id (FK → users.id), test_id (FK → soil_tests.id, nullable), message, is_read (bool), created_at`

*(Exact column types/constraints to be finalized during implementation; this is a starting schema, not a final DDL.)*

---

## 6. API Surface (indicative)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/signup` | Create a new user |
| POST | `/auth/login` | Authenticate, return JWT |
| GET | `/tests` | List current user's test records |
| POST | `/tests` | Create a new test record (incl. photo upload, lat/lng, concentration) |
| GET | `/tests/{id}` | Get a single test's detail |
| PATCH | `/tests/{id}/remediation` | Toggle remediation on/off for a test |
| GET | `/tests/heatmap-data` | Aggregated lat/lng/intensity data for the map |
| GET | `/notifications` | List current user's notifications |
| PATCH | `/notifications/{id}/read` | Mark a notification as read |

All endpoints except signup/login require a valid JWT (sent as a Bearer token).

---

## 7. Environment & Security Requirements (local scope)

- **`.env` file (backend):** must store, at minimum, the MySQL connection string/credentials and the JWT signing secret. Never hardcode these in source files.
- **`.env` file (frontend, if needed):** e.g., the local backend API base URL (`VITE_API_URL=http://localhost:8000`).
- **`.gitignore`:** must exclude, at minimum:
  - `.env` (all variants, e.g. `.env`, `.env.local`)
  - `node_modules/`
  - Python virtual environment folders (`venv/`, `__pycache__/`, `*.pyc`)
  - Local upload/media folders if they contain test data (`/uploads` or similar), unless intentionally versioned as sample data
  - Any local DB dump files
- No secrets, credentials, or API keys should ever be committed to version control at any point in this project.
- Passwords must be hashed (never stored or logged in plaintext).

---

## 8. Explicitly Out of Scope (for this PRD)

- Deployment to any cloud/hosting provider.
- HTTPS/SSL configuration.
- Real-time integration with the physical TerraGuard hardware device.
- SMS/push/email notification channels.
- Multi-language/localization support.
- Admin panel or multi-role user management.
- Payment/subscription/billing features.
- Automated testing/CI pipelines (not excluded from being good practice — simply not required for this version's completion criteria).

---

## 9. Development Roadmap & Checkpoints (Non-Coding, Sequential)

This is a **formal, non-technical** path through the build — describing *what* should exist at each stage and, critically, **where to deliberately stop and get a check/sign-off** before moving forward. Do not start the next checkpoint until the current one is reviewed and approved (by yourself acting as reviewer, a mentor, or whoever is acting as "admin" for this project).

> The rule of thumb: **one feature area, fully working end-to-end (UI + backend + database), before the next one begins.** Never build two unfinished features in parallel.

---

### Checkpoint 0 — Environment & Security Baseline
**What should exist:** Local MySQL running, FastAPI project skeleton running on localhost, React+Tailwind project skeleton running on localhost, a working `.env` file on both frontend and backend, and a `.gitignore` committed **before any other file**.

**🛑 STOP HERE.** Verify: the app runs locally end-to-end (even with empty/placeholder pages), and confirm that `.env` is *not* visible in `git status` as trackable. Do not proceed until this is confirmed clean.

---

### Checkpoint 1 — UI/UX Shell (No Logic Yet)
**What should exist:** Static, non-functional screens/pages for: login, signup, home/dashboard, a placeholder test-detail card, a placeholder notifications panel, and a placeholder map page. Navigation between them works. No real data, no backend calls yet — just the shape and look of the app.

**🛑 STOP HERE.** Verify: does the app *look* like the intended design (see the Design Doc)? Is navigation intuitive? Get a second pair of eyes if possible — this is the cheapest point to change the look before logic is wired in.

---

### Checkpoint 2 — Signup & Login (Full Stack)
**What should exist:** Real signup and login working end-to-end — user is created in MySQL, password is hashed, login returns a real JWT, and the frontend correctly stores/uses it to reach a protected page.

**🛑 STOP HERE — this is the checkpoint you specifically called out.** Before adding *any* further feature: test signup with a new account, log out, log back in, try a wrong password, try accessing a protected page without logging in. Confirm all of these behave correctly. Do not start Checkpoint 3 until this is solid — auth bugs compound painfully if built on top of.

---

### Checkpoint 3 — Test Record Core (Data + Photo Display)
**What should exist:** The `soil_tests` table exists; a way to create a test record (manually entered/seeded, per Assumption A1) including uploading a photo; the dashboard/home screen correctly lists real records and displays the photo and risk badge.

**🛑 STOP HERE.** Verify: create a few sample test records (including at least one of each risk level) and confirm they display correctly, photos load, and nothing is hardcoded/faked on the frontend anymore.

---

### Checkpoint 4 — Remediation Toggle & Day Counter
**What should exist:** The toggle switch works and persists to the database; turning it on sets a start date; the day-elapsed counter displays correctly and updates on reload; turning it off preserves history per the PRD.

**🛑 STOP HERE.** Verify: toggle on, wait (or manually adjust a test record's start date in the database to simulate several days passing), reload, and confirm the day count is accurate. Toggle off and confirm the historical start date is retained, not deleted.

---

### Checkpoint 5 — Notifications
**What should exist:** Backend logic that creates a notification when a new High/Moderate risk test is added, and/or when a remediation day threshold is crossed; frontend notification list with read/unread state.

**🛑 STOP HERE.** Verify: create a High-risk test record and confirm a notification appears without manual intervention; mark it read and confirm it updates correctly and doesn't reappear as unread.

---

### Checkpoint 6 — Heatmap
**What should exist:** The `/tests/heatmap-data` endpoint returns correctly shaped data; the map renders with sample/manual GPS coordinates; color intensity correctly reflects risk/concentration.

**🛑 STOP HERE — final feature checkpoint.** Verify: add several test records with different coordinates and risk levels, confirm the heatmap visually differentiates them correctly, and confirm the map performs reasonably with a handful of points.

---

### Checkpoint 7 — Full Walkthrough & Sign-off
**What should exist:** All six features working together in one continuous, realistic user session (signup → login → view dashboard → view a test's photo → toggle remediation → receive a notification → check the heatmap).

**🛑 FINAL STOP.** Do a full run-through as if you were a first-time user, end to end, without skipping steps. This is the checkpoint at which the v1 scope in Section 1 is considered complete — do not add anything from the "Explicitly Out of Scope" list (Section 8) until this full walkthrough has been reviewed and approved.

---

## 10. Acceptance Criteria (v1 / local demo)

The v1 build is considered complete when, running entirely on `localhost` against a local MySQL database:

1. A new user can sign up and log in.
2. A logged-in user can view a list of their soil test records, each showing a photo, risk level, and date.
3. A user can toggle remediation on/off for a test and see an accurate "days elapsed" counter while it's active.
4. The app surfaces at least one type of automatically generated notification (e.g., for a High-risk result) and lets the user view/mark it read.
5. A map view renders a heatmap from the user's test records using manually entered/seeded GPS coordinates.
6. No secrets are present in the committed source code; `.env` and `.gitignore` are correctly configured from the first commit.

---

## 11. Remaining Open Questions

- Should the "days of remediation" counter eventually have a target/expected duration (e.g., 14 or 30 days) shown as a progress bar, or should it remain an open elapsed count indefinitely?
- Should notifications have categories/types (e.g., "risk alert" vs "re-test reminder") distinguished visually, or is a single flat notification list sufficient for v1?
- Is risk-level-based color intensity acceptable for the heatmap, or is the actual numeric lead concentration required for the color gradient?
