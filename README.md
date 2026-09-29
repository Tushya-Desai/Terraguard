# TerraGuard
 
TerraGuard is a student project that combines a low-cost hardware prototype for detecting lead contamination in agricultural soil with a companion app that makes the results usable by a farmer or field worker. It was built for the MSME Hackathon 6.0 (theme: Other Technologies) by a 3-member team, and it's currently in active development — the hardware side (chemistry + prototype device) is designed and documented, and the software side (this app) is being built out feature by feature.
 
## Why this project exists
 
Lead contamination in agricultural soil is a real problem — it builds up silently over years from industrial runoff, mining, and overuse of certain fertilizers, and crops absorb it without any visible sign. The standard way to check for it is lab testing (ICP-MS, AAS, etc.), which is accurate but expensive, slow, and basically inaccessible to an average farmer or small institution. Government testing centers exist but are usually backlogged for weeks.
 
The TerraGuard device tries to close that gap with a portable colorimetric test: soil is extracted with acetic acid, treated with sodium rhodizonate (which turns pink-to-cherry-red in the presence of Pb²⁺), and a Raspberry Pi with a camera and OpenCV reads the color intensity to estimate lead concentration and classify the soil as Low / Moderate / High risk.
 
This repository is the **software companion** to that device — an app where a user can log in, see their test results (including the actual photo of the color reaction), track whether they've started remediation and for how long, get alerted when a result is risky, and see a heatmap of contamination across the plots they've tested.
 
## Current status
 
This is a work in progress. The scope for the current version is intentionally limited to running locally (localhost + local MySQL) — no deployment, no live hardware integration yet. Test data (photos, GPS coordinates, concentration values) is entered manually or seeded for now, since the software and hardware teams are being developed in parallel and aren't wired together yet.
 
## Features
 
Planned / in-progress for v1 (local scope):
 
- **Signup & Login** — basic account system, password hashing, JWT-based sessions.
- **Test dashboard** — list of soil test records, each showing the captured reaction photo, risk classification (Low/Moderate/High), plot label, and date.
- **Photo display** — the actual image captured during the colorimetric reaction is shown alongside each test result (not a live camera feature inside the app — the photo is uploaded/associated with a test record).
- **Remediation tracking** — a toggle to mark whether remediation is currently active for a given plot/test, with a running day counter since it was started.
- **Notifications/alerts** — in-app alerts for things like a new High-risk result or a re-test reminder after a certain number of days.
- **Heatmap** — a map view plotting test records by GPS coordinate, color-coded by contamination severity, to visualize which parts of a field are worse than others.
Not implemented (and not in scope for this version): push/SMS/email notifications, live device integration, multi-user roles (admin/NGO/farmer), cloud deployment, multi-language support.
 
## How it works (planned architecture)
 
```
User (browser) → React frontend → FastAPI backend → MySQL database
                                        ↑
                              Uploaded test photos
                              stored on local disk
```
 
- The **frontend** (React + Tailwind) handles login/signup forms, the dashboard, the remediation toggle, the notification list, and the map view.
- The **backend** (FastAPI) handles auth (JWT), CRUD for test records, notification logic, and serves uploaded photos as static files.
- **MySQL** stores users, test records, and notifications.
- The **heatmap** is rendered client-side using a JS mapping library, fed by an endpoint that returns test coordinates + intensity values.
This is the intended structure based on the current plan — it will be updated here once the actual codebase settles.
 
## Tech stack
 
| Layer | Technology |
|---|---|
| Frontend | React, JavaScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | MySQL |
| Auth | JWT (JSON Web Tokens), password hashing |
| Mapping/heatmap | A React-compatible JS mapping library (e.g. Leaflet) |
| Hardware (separate module) | Raspberry Pi, camera module, OpenCV, sodium rhodizonate colorimetric assay |
 
> The hardware column is included for context since TerraGuard is a combined hardware + software project, but this repository/README is focused on the software side.
 
## Project structure
 
The exact folder layout isn't finalized yet since the codebase is still being built out. Once the frontend and backend scaffolding are in place, this section will be updated with the real structure (e.g. `/frontend`, `/backend`, `/backend/app/models`, `/backend/app/routes`, etc.). For now, treat any structure shown elsewhere as tentative.
## Limitations
 
- No live connection to the physical device yet — all test data used during development is manually entered or seeded.
- Single user role only; no support for farms with multiple users/managers.
- Notifications are in-app only, no external channel (SMS/email/push).
- Not set up for deployment — runs locally only at this stage.
## Future improvements
 
These are ideas for later, not current functionality:
 
- Live data sync from the actual TerraGuard hardware.
- Push notifications or SMS fallback for areas with limited app usage.
- Multi-language support for wider farmer adoption.
- Trend graphs showing lead levels over time per plot.
- Exportable reports (PDF) for government/lab submission.
## Credits
 
Built by a 6-member team for SIH Hackathon 6.0:
- Hardware, electronics, and mechanical prototype development = Kamyaa Joshi, Vidhi Vyas, Kripa Patel
- Chemistry (sodium rhodizonate protocol, soil extraction, reagent optimization) = Akshat Jariwala
- Software (this app, plus Raspberry Pi/OpenCV image processing) = Tushya Desai, Amey Pathak 
## References
 
The colorimetric detection method used in the hardware prototype is based on established chemistry, referenced from:
 
- Extraction of lead, cadmium and nickel from contaminated soil using acetic acid — DOI: 10.4236/ojss.2014.46023
- "A Field Procedure To Screen Soil for Hazardous Lead" — ACS Analytical Chemistry
- "An Update on the Use of the Sodium Rhodizonate Test for the Detection of Lead Originating from Firearm Discharges" — DOI: 10.1520/JFS14047J
## License
 
No license has been added to this repository yet. One can be added later if the project is intended to be shared or reused publicly.
