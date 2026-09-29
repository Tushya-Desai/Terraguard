# TerraGuard
 
TerraGuard is a student project that combines a low-cost hardware prototype for detecting lead contamination in agricultural soil with a companion web application for storing, visualizing, and managing soil-test results.
 
It was developed for **MSME Hackathon 6.0** under the theme **Other Technologies**. The hardware uses a colorimetric approach with sodium rhodizonate, while the software provides authentication, soil-test management, remediation tracking, notifications, and location-based visualization.
 
## Why this project exists
 
Lead contamination in agricultural soil can build up over time from sources such as industrial runoff, mining, and certain agricultural practices. Laboratory methods such as ICP-MS and AAS are accurate but can be expensive and less accessible for farmers and small institutions.
 
The TerraGuard prototype uses:
 
1. Soil extraction using acetic acid.
2. Sodium rhodizonate for the colorimetric reaction.
3. Raspberry Pi and camera-based image capture.
4. OpenCV image processing to analyze the reaction color.
5. Lead concentration estimation and Low / Moderate / High risk classification.
The software companion allows these results to be stored, viewed, and associated with geographic locations.
 
> TerraGuard is a student prototype and is intended as a preliminary screening system, not as a replacement for certified laboratory testing.
 
## Current status
 
The software is currently **deployed and functional**.
 
Production architecture:
 
```
User Browser
     ↓
Vercel — React Frontend
     ↓
Render — FastAPI Backend
     ↓
Aiven — MySQL Database
```
 
The hardware and software modules are currently developed separately. Test information can therefore be entered through the application while hardware and Raspberry Pi/OpenCV integration continue in parallel.
 
## Features
 
- **Signup & Login** — JWT authentication and password hashing.
- **Soil test dashboard** — view and manage soil-test records.
- **Test creation** — create tests with location and result information.
- **Photo display** — view the color-reaction image associated with a test.
- **Risk classification** — Low / Moderate / High contamination levels.
- **Remediation tracking** — track whether remediation is active and its duration.
- **Notifications** — in-app alerts such as high-risk results and re-test reminders.
- **Location visualization** — display test locations and contamination levels on a map/heatmap.
## Tech stack
 
| Layer | Technology |
|---|---|
| Frontend | React, JavaScript, Tailwind CSS |
| Backend | Python, FastAPI, Uvicorn |
| Database | MySQL |
| Production database | Aiven MySQL |
| Authentication | JWT, password hashing |
| ORM / DB layer | SQLAlchemy, PyMySQL |
| Mapping | React-compatible mapping library |
| Image processing | OpenCV |
| Hardware | Raspberry Pi, camera |
| Source control | Git, GitHub |
| Frontend deployment | Vercel |
| Backend deployment | Render |
 
## Limitations
 
- No live connection between the physical TerraGuard device and the deployed application yet.
- Hardware and software modules are currently separate.
- Test data may still be entered manually.
- Single primary user role.
- Notifications are currently in-app only — no SMS, email, or push notifications.
- Colorimetric detection is a prototype screening method and does not replace certified laboratory testing.
## Future improvements
 
- Live Raspberry Pi → cloud data synchronization.
- Automatic upload of OpenCV test results.
- Improved color calibration and lead estimation.
- Multi-language support.
- Multiple user roles.
- SMS/push notifications.
- Lead-level trend graphs.
- PDF report generation.
- Improved field-level contamination analytics.
## Credits
 
Built by a student team for SIH Hackathon 6.0.
 
**Electronics & Chemistry:**
- Kamyaa Joshi
- Vidhi Vyas
- Kripa Patel


**Hardware & Mechanical**
- Akshat Jariwala

**Software**
- Tushya Desai
- Amey Pathak
## References
 
- Extraction of lead, cadmium and nickel from contaminated soil using acetic acid — DOI: 10.4236/ojss.2014.46023
- "A Field Procedure To Screen Soil for Hazardous Lead" — ACS Analytical Chemistry
- "An Update on the Use of the Sodium Rhodizonate Test for the Detection of Lead Originating from Firearm Discharges" — DOI: 10.1520/JFS14047J
## License
 
No license has been added to this repository yet. A license can be added later if the project is intended to be publicly shared or reused.
