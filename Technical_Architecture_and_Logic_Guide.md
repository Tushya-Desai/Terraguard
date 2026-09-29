# TerraGuard Companion Application — Technical Architecture, Logic & User Guide

---

## 1. System Overview & Architectural Topology

The **TerraGuard Companion Application** is a localized agricultural software module designed to complement field soil-testing workflows (specifically colorimetric lead detection devices). It enables farmers, agronomists, and environmental researchers to:
1. Digitize soil test records with photographic reaction evidence.
2. Quantify and categorize soil lead ($Pb$) concentrations.
3. Track the duration of active soil bio-remediation cycles.
4. Visualize geospatial contamination patterns through a risk-weighted map.
5. Receive automatic in-app alerts when contamination thresholds or remediation milestones are reached.

### 1.1 High-Level Architecture

The system is decoupled into three primary tiers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION TIER                             │
│                  React 19 SPA + Tailwind CSS + Leaflet                  │
│       (Mobile-First UI, Focal Status Card, Heatmap, Alert Center)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ JSON REST Requests /
                                     │ Multipart Form Uploads + JWT
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION TIER                              │
│                          FastAPI (Python 3.13)                          │
│     (Auth Engine, Risk Classifier, Remediation Timer, Alert Engine)     │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
     SQL Queries /  │                  File Writes /  │ Static File
     ORM Entities   │                  File Reads     │ Serving (/uploads)
                    ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────────────┐
│         DATABASE TIER         │ │             STORAGE TIER              │
│       MySQL 8.0 Engine        │ │          Local Disk Storage           │
│ (Users, Soil Tests, Alerts)   │ │  (Colorimetric Strip & Cuvette Imgs)  │
└───────────────────────────────┘ └───────────────────────────────────────┘
```

1. **Presentation Tier (Frontend):** A Single Page Application (SPA) built with React and styled with a custom design system in Tailwind CSS. It communicates asynchronously with the backend via an Axios HTTP client equipped with request and response interceptors.
2. **Application Tier (Backend):** A high-performance asynchronous REST API powered by FastAPI. It handles request validation, cryptographic operations, business logic, temporal computations, and file system management.
3. **Database & Storage Tier:** 
   - A relational MySQL database storing structured entities (`users`, `soil_tests`, `notifications`) with foreign key constraints.
   - A dedicated local file storage directory (`/uploads`) storing binary image files, decoupled from the relational database.

---

## 2. End-to-End Data Ingestion & Processing Pipeline

### 2.1 Data Ingestion Channels

Data enters the system via two distinct mechanisms:

```
[User Action: Create Test]
   │
   ├─► 1. Binary Image Stream (Reaction Photo) ──► Saved to Disk (/uploads/{uuid}.jpg)
   │                                                 └─► Stored in DB as photo_path
   │
   ├─► 2. Numeric Concentration (Lead ppm) ────► Validated (>= 0.0) ──► Processed by Risk Classifier
   │
   ├─► 3. Geographic Coordinates (Lat, Lng) ──► Validated Floats ────► Normalized for Map Rendering
   │
   ├─► 4. Text Label (Plot Name) ─────────────► Sanitized String ─────► Associated with User Account
   │
   └─► 5. Remediation Flag (Boolean) ─────────► Evaluates Date Logic ─► Starts Remediation Cycle
```

### 2.2 Field-by-Field Processing Lifecycle

| Field Name | Ingestion Format | Processing & Transformation Method | Storage Location | Retrieval & Rendering Logic |
|---|---|---|---|---|
| **User Identity** (`user_id`) | Extracted from JWT Bearer Token | Decoded and validated via HMAC-SHA256 signature; mapped to active session | `soil_tests.user_id` (FK to `users.id`) | Ensures strict data isolation: users only access their own soil plots. |
| **Reaction Photo** (`photo`) | Multipart File Stream (`image/*`) | Assigned a cryptographic `UUIDv4` filename to prevent collisions; saved to local `/uploads` directory; binary data is never stored in SQL | `soil_tests.photo_path` (String filename) | Formatted dynamically into a fully qualified static asset URL (`/uploads/{filename}`) and displayed in uncompressed, unfiltered image containers. |
| **Plot Identifier** (`plot_label`) | Text string | Stripped of leading/trailing whitespace; defaults to `"Plot 1"` if omitted | `soil_tests.plot_label` (VarChar 150) | Rendered as primary heading across cards, detail modals, and map popups. |
| **Lead Concentration** (`lead_concentration`) | Numeric String / Float | Validated as non-negative decimal; converted to floating-point number | `soil_tests.lead_concentration` (Float) | Displayed prominently in parts-per-million ($ppm$). Used to calculate risk category and heat map weights. |
| **Risk Level** (`risk_level`) | Optional string (`low`, `moderate`, `high`) | If not provided, computed automatically via the **Thresholding Classifier Algorithm** | `soil_tests.risk_level` (VarChar 20) | Mapped to strict visual tokens (`#3E9142` Safe, `#E0A526` Warning, `#C24C3D` Danger) for badges, cards, and map markers. |
| **Geographic Coordinates** (`latitude`, `longitude`) | Decimal Floats (WGS84) | Validated as standard geospatial coordinates; nullable for non-mapped plots | `soil_tests.latitude`, `soil_tests.longitude` (Float) | Filtered and projected onto Leaflet raster tiles; marker clusters center automatically. |
| **Remediation Status** (`remediation_active`) | Boolean (`true`/`false`) | Evaluated against current timestamp; triggers automated state transitions | `soil_tests.remediation_active` (Boolean) | Renders active pulse indicator and activates server-side elapsed-day counter. |
| **Remediation Start Date** (`remediation_start_date`) | Datetime Timestamp | If remediation is toggled `ON` and no start date exists, records current UTC timestamp. If toggled `OFF`, **retains timestamp** for historical audit | `soil_tests.remediation_start_date` (DateTime UTC) | Fed into the **Temporal Difference Engine** to compute days elapsed. |
| **Elapsed Days** (`days_elapsed`) | Computed Virtual Field | Calculated dynamically on the server upon every request | *Not stored in DB* (computed on read) | Displayed as `"Day X elapsed"` adjacent to toggle switches. |

---

## 3. Core Algorithms, Processing Methods & Logic

The system utilizes five foundational logical engines to process raw agricultural data into actionable metrics.

---

### Algorithm 1: Soil Lead Risk Classification Method

```
                   ┌────────────────────────────────────────┐
                   │ Input: Lead Concentration C (ppm)      │
                   └───────────────────┬────────────────────┘
                                       │
                         Is C < 200 ppm?
                        /               \
                    YES/                 \NO
                      ▼                   ▼
           ┌─────────────────────┐   Is C <= 400 ppm?
           │ Risk Level: LOW     │   /              \
           │ Status: SAFE        │YES/               \NO
           │ Color: #3E9142      │  ▼                 ▼
           └─────────────────────┘ ┌───────────────┐ ┌───────────────┐
                                   │ Risk: MODERATE│ │ Risk: HIGH    │
                                   │ Status: WARN  │ │ Status: DANGER│
                                   │ Color:#E0A526 │ │ Color:#C24C3D │
                                   └───────────────┘ └───────────────┘
```

#### Logical Formulation:
Let $C_{\text{Pb}}$ represent the measured soil lead concentration in parts-per-million ($mg/kg$). The classification function $f(C_{\text{Pb}})$ is defined as:

$$f(C_{\text{Pb}}) = \begin{cases} 
\text{Low / Safe}, & 0 \le C_{\text{Pb}} < 200 \\
\text{Moderate / Warning}, & 200 \le C_{\text{Pb}} \le 400 \\
\text{High / Unsafe}, & C_{\text{Pb}} > 400 
\end{cases}$$

#### Scientific Rationale:
- **Low Risk ($<200\text{ ppm}$):** Aligns with current empirical colorimetric data (0-100 ppm clear/light reaction), indicating safe agricultural levels.
- **Moderate Risk ($200 - 400\text{ ppm}$):** Indicates elevated contamination (200-300 ppm amber/murky reaction) where caution is advised; soil amendments and bio-remediation are recommended.
- **High Risk ($>400\text{ ppm}$):** Exceeds safe thresholds (400-500+ ppm dark reaction) for food cultivation; requires immediate bio-remediation, phytoremediation, or soil replacement.

---

### Algorithm 2: Dynamic Remediation Elapsed-Time Engine

To eliminate client-side clock discrepancies and timezone drift, remediation durations are computed strictly on the backend during serialization.

```
                          ┌────────────────────────────┐
                          │ Check: Remediation Active? │
                          └─────────────┬──────────────┘
                                        │
                         Is remediation_active == true?
                        /                              \
                    YES/                                \NO
                      ▼                                  ▼
         ┌──────────────────────────────┐       ┌─────────────────┐
         │ start_date is set?           │       │ Return: 0 days  │
         │ YES: Δt = UTC_now - start    │       └─────────────────┘
         │ Days = max(0, Δt.days)       │
         │ Return: Days                 │
         └──────────────────────────────┘
```

#### Mathematical Formulation:
Let $T_{\text{now}}$ be the current system time in UTC, $T_{\text{start}}$ be the recorded remediation start timestamp in UTC, and $S_{\text{active}} \in \{0, 1\}$ be the remediation boolean state.

$$\text{DaysElapsed}(T_{\text{start}}, S_{\text{active}}) = \begin{cases} 
\max\left(0, \left\lfloor \frac{T_{\text{now}} - T_{\text{start}}}{86400} \right\rfloor\right), & \text{if } S_{\text{active}} = 1 \text{ and } T_{\text{start}} \neq \text{null} \\
0, & \text{otherwise}
\end{cases}$$

#### Historical Retention Logic:
When a user toggles remediation from `ON` to `OFF`:
1. `remediation_active` is set to `False`.
2. `remediation_start_date` is **preserved** in the database (never erased or overwritten).
3. The day counter ceases incrementing in the active display, but the audit trail remains intact.

---

### Algorithm 3: Automated Event-Driven Alert Trigger Engine

The application evaluates two distinct event triggers during data mutations to automatically generate in-app notifications without manual intervention:

```
[Event 1: New Soil Test Created]
   │
   ├─► Risk Level == 'moderate' ──► Auto-create "Moderate Lead Risk Detected" Notification
   │
   └─► Risk Level == 'high'     ──► Auto-create "High Lead Risk Detected" Notification

[Event 2: Remediation Cycle Updated]
   │
   └─► Is active AND Days >= 30?
         │
         ├─► Notification already exists for this test? ──► Do nothing (prevent duplicate spam)
         │
         └─► Notification not found ─────────────────────► Auto-create "Day 30 Milestone / Re-test" Alert
```

#### Trigger Rules:
1. **Immediate Risk Trigger:** Fires during `POST /tests`. If the computed risk is `moderate` or `high`, an unread notification record linked to the specific test ID is committed to the `notifications` table in the same transaction.
2. **Cumulative Milestone Trigger:** Fires during `PATCH /tests/{id}/remediation`. When a plot reaches or exceeds 30 elapsed days, the engine checks for prior milestone notices for that test ID. If none exists, an alert is issued advising the farmer to perform a follow-up test.

---

### Algorithm 4: Geospatial Risk-Intensity Normalization & Radial Gradient

For mapping visualization, each soil test point with valid coordinates $(lat_i, lng_i)$ is converted into a normalized intensity weight $I_i \in [0.0, 1.0]$.

```
┌─────────────────┬───────────────────────────┬───────────────────┬──────────────────────┐
│ Risk Level      │ Normalized Intensity (I)  │ Base Color        │ Outer Halo Radius    │
├─────────────────┼───────────────────────────┼───────────────────┼──────────────────────┤
│ Low (Safe)      │ I = 0.35                  │ Green (#3E9142)   │ Radius = 19.1 px     │
│ Moderate (Warn) │ I = 0.65                  │ Amber (#E0A526)   │ Radius = 26.9 px     │
│ High (Danger)   │ I = 1.00                  │ Red (#C24C3D)     │ Radius = 36.0 px     │
└─────────────────┴───────────────────────────┴───────────────────┴──────────────────────┘
```

#### Radial Formula:
$$\text{Radius}_{\text{glow}} = (I_i \times 26) + 10 \quad \text{[pixels]}$$

#### Layering Architecture:
1. **Base Layer:** Muted Carto Voyager vector tile layer ensuring background maps do not compete visually with agricultural data.
2. **Ambient Heat Halo:** A low-opacity ($18\%$) semi-transparent circular boundary representing contamination spread.
3. **Core Anchor Marker:** A solid $9\text{px}$ high-contrast pinpoint with a $2.5\text{px}$ white stroke, rendering interactive popups upon user click.

---

### Algorithm 5: Cryptographic Authentication & Stateless Token Engine

```
[User Login Request] ──► Query User by Email
                            │
              User exists & bcrypt.checkpw(password, hash) == true?
             /                                                     \
         YES/                                                       \NO
           ▼                                                         ▼
 Generate JWT Payload:                                      Return 401 Error:
 { "sub": user.id, "exp": now + 24h }                       "Invalid email or password"
 Sign with HMAC-SHA256 & Secret Key                         (Non-revealing error message)
 Return Bearer Token
```

1. **Password Hashing:** Passwords are never stored in plain text. They are hashed using `bcrypt` with an automatically generated per-user salt ($2^{12}$ work factor iterations).
2. **Non-Revealing Credential Evaluation:** To mitigate user enumeration attacks (PRD 4.2), the endpoint returns an identical generic error message whether the email does not exist or the password fails verification.
3. **JWT Authorization:** Authenticated requests include an `Authorization: Bearer <token>` header. The token payload contains the user's primary key (`sub`), verified on every request via FastAPI dependencies.

---

## 4. Comprehensive Feature Guide & Usage

---

### Feature 1: User Authentication & Session Management

```
┌────────────────────────────────────────────────────────┐
│                      TERRAGUARD                        │
│                   [ Sign In Form ]                     │
│                                                        │
│  Email:    [ farmer@terraguard.org                   ] │
│  Password: [ •••••••••••••                           ] │
│                                                        │
│  [                SIGN IN BUTTON                     ] │
│                                                        │
│  ✨ Quick Fill Demo Account    |    Sign up here       │
└────────────────────────────────────────────────────────┘
```

- **Purpose:** Restricts access to authenticated users and ensures private multi-tenant plot isolation.
- **How to Use:**
  - **Sign In:** Enter registered credentials. Users can click *"Quick Fill Demo Account"* to autofill sample credentials (`farmer@terraguard.org` / `farmer123`).
  - **Sign Up:** Click *"Sign up here"*, enter Full Name, Email, Password (min 6 characters), and optional Farm/Location Name, then submit.
  - **Token Storage:** Upon success, the JWT token is persisted in browser `localStorage` and attached automatically to subsequent API calls.
  - **Sign Out:** Click *"Sign Out"* from the Profile view to clear local session tokens and redirect to the login screen.

---

### Feature 2: Executive Soil Health Summary ("Is My Soil Okay?")

```
┌────────────────────────────────────────────────────────────────────────┐
│ LATEST ASSESSMENT • Sector 4 North Plot              [ Safe / Low Risk]│
│                                                                        │
│  🛡️  Soil is Safe / Low Risk                                          │
│      Lead concentration is within safe agricultural standards.         │
│                                                                        │
│ ┌───────────────────┐ ┌───────────────────┐ ┌────────────────────────┐ │
│ │ LEAD CONTENT      │ │ TOTAL PLOTS       │ │ ACTIVE CYCLES          │ │
│ │ 35.0 ppm          │ │ 4                 │ │ ⚡ 2                   │ │
│ └───────────────────┘ └───────────────────┘ └────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- **Purpose:** Answers the single most critical farmer question immediately upon opening the app without requiring any scrolling or navigation.
- **Visual Design:**
  - **Green Gradient Banner:** Displayed when the latest test is safe ($<200\text{ ppm}$).
  - **Amber Gradient Banner:** Displayed when moderate caution is advised ($200-400\text{ ppm}$).
  - **Red Gradient Banner:** Displayed when dangerous contamination is detected ($>400\text{ ppm}$).
- **Summary Metrics:** Shows latest lead ppm, total plots monitored, and current active remediation cycles across the entire farm.

---

### Feature 3: Soil Test Record Management & Photo Display

```
┌────────────────────────────────────────────────────────────────────────┐
│  📍 South Riverbank (Plot B)                     [ Moderate / Warning] │
│ ┌─────────────────────┐                                                │
│ │ [Reaction Photo]    │  LEAD CONCENTRATION                            │
│ │   Amber Cuvette     │  180.0 ppm                                     │
│ │   Reaction Image    │                                                │
│ │   (Click to Zoom)   │  📅 Oct 14, 2026   🌐 28.6190, 77.2180         │
│ └─────────────────────┘                                                │
│ ────────────────────────────────────────────────────────────────────── │
│ 🟢 Remediation Active • ⏱️ Day 12 elapsed               [ TOGGLE ON ]   │
└────────────────────────────────────────────────────────────────────────┘
```

- **Purpose:** Displays all historical and active soil test cards.
- **Key Elements:**
  - **Colorimetric Reaction Photo:** Unfiltered, real-world image of the test strip or vial reaction.
  - **Risk Pill Badge:** Color-coded status indicator with assistive icon.
  - **PPM Metric:** Bold display of detected lead level.
  - **Interactive Lightbox:** Clicking any photo opens the **Test Detail Modal**, revealing full-screen reaction imagery, exact coordinates, and sample dates.
- **Filter Bar:** Farmers can filter the list by:
  - `All Plots`
  - `Active Remediation`
  - `High Risk`
  - `Moderate`
  - `Safe`

---

### Feature 4: Remediation Cycle Management & Elapsed Day Counter

- **Purpose:** Enables tracking of biological or chemical soil remediation treatments over time.
- **How to Use:**
  1. Locate any soil test card.
  2. Click the **Remediation Switch**.
  3. When turned **ON**: The toggle glows green, displays a pulsating status dot, and initiates the server-calculated `"Day 0 elapsed"` counter that increments automatically every 24 hours.
  4. When turned **OFF**: The active timer stops, but the historical start date is retained in the database.

---

### Feature 5: In-App Notification & Alert Center

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🔔 Notifications & Alerts                         [ Mark All Read ]    │
│                                                                        │
│ 🛑 [High Lead Risk Detected]                             • (Unread)    │
│    Soil test at 'East Canal Field' recorded 450.0 ppm lead.            │
│    Immediate bio-remediation is recommended.                           │
│    Oct 23, 2026 • Risk Alert                                           │
│ ────────────────────────────────────────────────────────────────────── │
│ ⏱️ [Remediation Milestone Reached]                                      │
│    Remediation for 'East Canal Field' has passed 30 days.              │
│    It is time to perform a follow-up soil test.                        │
│    Nov 24, 2026 • Remediation Milestone                                │
└────────────────────────────────────────────────────────────────────────┘
```

- **Purpose:** Centralized hub for alerts triggered by high risk results or remediation deadlines.
- **Features:**
  - **Unread Badge Counters:** Displayed in the top navigation bar and bottom navigation tab.
  - **Category Badges:** Visually differentiates `Risk Alert` from `Remediation Milestone`.
  - **Interactive Read State:** Clicking any alert marks it as read, updating badge counters immediately.
  - **Bulk Action:** *"Mark All Read"* clears all pending notifications in a single click.

---

### Feature 6: Geospatial Lead Heatmap & Plot Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│ 📍 Geospatial Lead Heatmap                     [ All | High | Mod | Safe]
│┌──────────────────────────────────────────────────────────────────────┐│
││                      (Muted Map Tiles)                               ││
││                                                                      ││
││               🔴 (High: 450 ppm)                                     ││
││               / \                                                    ││
││     🟡 (180 ppm)  🟢 (35 ppm)                                        ││
││                                                                      ││
││                                              ┌─────────────────────┐ ││
││                                              │ Map Legend          │ ││
││                                              │ 🟢 Safe (<200)      │ ││
││                                              │ 🟡 Mod (200-400)    │ ││
││                                              │ 🔴 High (>400)      │ ││
││                                              └─────────────────────┘ ││
│└──────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

- **Purpose:** Geospatial aggregation of soil lead distribution across agricultural acreage.
- **How It Works:**
  - Aggregates all user test records with recorded GPS coordinates.
  - Generates dual-radius circular points scaled by lead intensity.
  - Clicking any map marker reveals an informational card with the plot name, photo preview, risk badge, and numeric lead concentration.
  - Features filter buttons to isolate specific risk zones (e.g. view only `High Danger` plots).

---

### Feature 7: Recording a New Soil Test

- **How to Use:**
  1. Click the primary **"+ Record New Test"** button on the Dashboard.
  2. **Attach Reaction Photo:** Select or snap an image of the colorimetric test strip or cuvette.
  3. **Enter Plot Name:** e.g., `"North Acre - Plot A"`.
  4. **Enter Lead Concentration:** Input the measured numerical value in ppm (e.g., `45.0`). The modal displays a live preview of the computed risk badge.
  5. **Set GPS Coordinates:** Manually enter latitude/longitude or click *"Auto-fill GPS"* to retrieve device location coordinates.
  6. **Initial Remediation:** Check *"Start Remediation Cycle"* if treatment begins immediately.
  7. Click **"Save Soil Test"**. The test is stored in MySQL, the image is written to disk, and any required alerts are triggered automatically.

---

### Feature 8: High-Contrast Dark & Light Theme Engine

- **Purpose:** Accommodates high-glare daytime field conditions (Light Mode) and low-light nighttime farm audits (Dark Mode).
- **Tokens:**
  - **Light Theme:** Warm cream canvas (`#FAF7F0`), crisp white cards (`#FFFFFF`), deep grey typography (`#22221E`).
  - **Dark Theme:** Deep warm charcoal-green (`#141813`), elevated dark cards (`#1E241C`), soft off-white typography (`#F2EFE9`).
- **How to Toggle:** Click the **Sun/Moon icon** in the top navbar or switch the toggle in the **Profile** view. Preference is persisted in `localStorage`.

---

## 5. Visual Palette & Semantic Consistency Rules

To prevent cognitive confusion for field operators, color assignments are strictly guarded across the entire application:

```
┌───────────────────────┬───────────────────────┬────────────────────────────────────────┐
│ Semantic Purpose      │ Color Value / Hex     │ Restricted Usage Rule                  │
├───────────────────────┼───────────────────────┼────────────────────────────────────────┤
│ Brand Primary         │ Medium Green (#4C8C5C)│ Navigation, primary buttons, logo mark │
│ Brand Secondary       │ Warm Gold (#B8863B)   │ Monogram accents, map pin highlights   │
│ Safe / Low Risk       │ Leaf Green (#3E9142)  │ RESERVED: Safe badges, safe map pins   │
│ Warning / Moderate    │ Amber Gold (#E0A526)  │ RESERVED: Moderate badges, warnings    │
│ Danger / High Risk    │ Deep Red (#C24C3D)    │ RESERVED: High risk badges, danger pins│
└───────────────────────┴───────────────────────┴────────────────────────────────────────┘
```

> **Design Guardrail:** Generic UI components (such as a "Delete" action or normal navigation items) **never** use the reserved `#C24C3D` Red or `#3E9142` Risk Green to ensure colors always convey true environmental safety status.

---

## 6. Database Schema & Entity Relationships

```
┌────────────────────────────────────────────────────────┐
│                        USERS                           │
├────────────────────────────────────────────────────────┤
│  id                 INT (PK, Auto-Increment)           │
│  name               VARCHAR(100)                       │
│  email              VARCHAR(150, UNIQUE, Index)        │
│  password_hash      VARCHAR(255)                       │
│  farm_label         VARCHAR(150, Nullable)             │
│  created_at         DATETIME UTC                       │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ 1 : N (CASCADE DELETE)
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
         ▼                                     ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│            SOIL_TESTS            │ │          NOTIFICATIONS           │
├──────────────────────────────────┤ ├──────────────────────────────────┤
│ id                 INT (PK)      │ │ id                 INT (PK)      │
│ user_id            INT (FK)      │ │ user_id            INT (FK)      │
│ plot_label         VARCHAR(150)  │ │ test_id            INT (FK, Null)│
│ latitude           FLOAT (Null)  │ │ title              VARCHAR(150)  │
│ longitude          FLOAT (Null)  │ │ message            TEXT          │
│ photo_path         VARCHAR(300)  │ │ notification_type  VARCHAR(50)   │
│ lead_concentration FLOAT         │ │ is_read            BOOLEAN       │
│ risk_level         VARCHAR(20)   │ │ created_at         DATETIME UTC  │
│ remediation_active BOOLEAN       │ └──────────────────────────────────┘
│ remediation_start  DATETIME(Null)│
│ tested_at          DATETIME UTC  │
│ created_at         DATETIME UTC  │
└──────────────────────────────────┘
```

---

## 7. Summary of Technical Principles

1. **Decoupled Binary Storage:** Soil images reside on the filesystem; only relative URI pointers are maintained in MySQL.
2. **Server-Side Temporal Calculations:** Elapsed remediation days are calculated during API response generation to prevent client timezone drift.
3. **Data Isolation:** All database queries are filtered by the authenticated user's ID derived from verified JWT tokens.
4. **Resilient Data Seeding:** A single-click seeding mechanism allows instant generation of sample plots, colorimetric reaction images, and historical remediation timelines for testing and demonstrations.
