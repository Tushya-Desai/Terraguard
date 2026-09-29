import os
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .config import settings
from .database import engine, SessionLocal, init_db
from .models import User, SoilTest, Notification
from .auth import hash_password

def create_sample_reaction_image(filename: str, color_rgb: tuple, text_label: str):
    """Generate a high-quality SVG or PNG-compatible sample reaction image."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    # Generate an SVG file with a realistic colorimetric soil reaction vial/strip
    r, g, b = color_rgb
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e241c"/>
      <stop offset="100%" stop-color="#141813"/>
    </linearGradient>
    <linearGradient id="vial" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
      <stop offset="40%" stop-color="rgba(255,255,255,0.05)"/>
      <stop offset="80%" stop-color="rgba(255,255,255,0.2)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.3)"/>
    </linearGradient>
    <radialGradient id="reactionGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgb({r},{g},{b})" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="rgb({max(0, r-40)},{max(0, g-40)},{max(0, b-40)})" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="rgb({max(0, r-80)},{max(0, g-80)},{max(0, b-80)})" stop-opacity="0.75"/>
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="400" height="300" rx="16" fill="url(#bg)"/>
  
  <!-- Soil context pattern -->
  <circle cx="50" cy="50" r="80" fill="#4c8c5c" opacity="0.05"/>
  <circle cx="350" cy="250" r="100" fill="#b8863b" opacity="0.05"/>

  <!-- Reaction Chamber / Cuvette -->
  <g filter="url(#shadow)">
    <!-- Liquid reaction chamber -->
    <rect x="130" y="50" width="140" height="180" rx="20" fill="url(#reactionGlow)"/>
    <rect x="130" y="50" width="140" height="180" rx="20" fill="url(#vial)"/>
    
    <!-- Chamber Highlights & Markings -->
    <rect x="130" y="50" width="140" height="180" rx="20" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <line x1="145" y1="90" x2="165" y2="90" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <line x1="145" y1="130" x2="175" y2="130" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <line x1="145" y1="170" x2="165" y2="170" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    
    <!-- Cap -->
    <rect x="145" y="32" width="110" height="22" rx="4" fill="#2f5c3a" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  </g>

  <!-- Label Badge -->
  <rect x="90" y="250" width="220" height="32" rx="16" fill="#1e241c" stroke="#4c8c5c" stroke-width="1.5"/>
  <text x="200" y="271" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#FAF7F0" text-anchor="middle">
    {text_label}
  </text>
</svg>"""
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    return filename

def seed_database(db: Session = None):
    """Seed demo user, soil tests, reaction photos, and notifications."""
    owns_session = False
    if db is None:
        init_db()
        db = SessionLocal()
        owns_session = True

    try:
        # 1. Create Demo User
        demo_email = "farmer@terraguard.org"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            user = User(
                name="Demo Farmer",
                email=demo_email,
                password_hash=hash_password("farmer123"),
                farm_label="Green Valley Farm (Sector 7)"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[Seed] Created demo user: {demo_email} (password: farmer123)")
        else:
            print(f"[Seed] Demo user {demo_email} already exists.")

        # 2. Generate Sample Reaction Photos
        img_safe = create_sample_reaction_image("sample_reaction_safe.svg", (62, 145, 66), "Reaction: Clear / Safe (35 ppm)")
        img_mod = create_sample_reaction_image("sample_reaction_moderate.svg", (224, 165, 38), "Reaction: Amber / Caution (280 ppm)")
        img_high = create_sample_reaction_image("sample_reaction_high.svg", (194, 76, 61), "Reaction: Red / Danger (450 ppm)")
        img_pristine = create_sample_reaction_image("sample_reaction_pristine.svg", (76, 140, 92), "Reaction: Green / Optimal (15 ppm)")

        # 3. Seed Soil Tests if empty
        existing_tests = db.query(SoilTest).filter(SoilTest.user_id == user.id).count()
        now_utc = datetime.now(timezone.utc)

        if existing_tests == 0:
            tests_data = [
                SoilTest(
                    user_id=user.id,
                    plot_label="North Acre (Plot A)",
                    latitude=28.6139,
                    longitude=77.2090,
                    photo_path=img_safe,
                    lead_concentration=35.0,
                    risk_level="low",
                    remediation_active=False,
                    remediation_start_date=None,
                    tested_at=now_utc - timedelta(days=2)
                ),
                SoilTest(
                    user_id=user.id,
                    plot_label="South Riverbank (Plot B)",
                    latitude=28.6190,
                    longitude=77.2180,
                    photo_path=img_mod,
                    lead_concentration=280.0,
                    risk_level="moderate",
                    remediation_active=True,
                    remediation_start_date=now_utc - timedelta(days=12),
                    tested_at=now_utc - timedelta(days=12)
                ),
                SoilTest(
                    user_id=user.id,
                    plot_label="East Canal Field (Plot C)",
                    latitude=28.6250,
                    longitude=77.2050,
                    photo_path=img_high,
                    lead_concentration=450.0,
                    risk_level="high",
                    remediation_active=True,
                    remediation_start_date=now_utc - timedelta(days=31),
                    tested_at=now_utc - timedelta(days=31)
                ),
                SoilTest(
                    user_id=user.id,
                    plot_label="West Greenhouse (Plot D)",
                    latitude=28.6080,
                    longitude=77.2150,
                    photo_path=img_pristine,
                    lead_concentration=15.0,
                    risk_level="low",
                    remediation_active=False,
                    remediation_start_date=None,
                    tested_at=now_utc - timedelta(days=5)
                ),
            ]
            db.add_all(tests_data)
            db.commit()
            print(f"[Seed] Added {len(tests_data)} sample soil tests.")

            # Seed notifications for high/moderate and threshold
            notif1 = Notification(
                user_id=user.id,
                test_id=tests_data[2].id, # High risk test
                title="High Lead Risk Detected",
                message="Soil test at 'East Canal Field (Plot C)' recorded 450.0 ppm lead concentration (HIGH risk). Immediate bio-remediation is recommended.",
                notification_type="risk_alert",
                is_read=False,
                created_at=now_utc - timedelta(days=31)
            )
            notif2 = Notification(
                user_id=user.id,
                test_id=tests_data[2].id,
                title="Remediation Milestone Reached (Day 31)",
                message="Remediation for 'East Canal Field (Plot C)' has passed 30 days. It is time to perform a follow-up soil test.",
                notification_type="remediation_milestone",
                is_read=False,
                created_at=now_utc - timedelta(days=1)
            )
            notif3 = Notification(
                user_id=user.id,
                test_id=tests_data[1].id, # Moderate risk test
                title="Moderate Lead Risk Detected",
                message="Soil test at 'South Riverbank (Plot B)' recorded 280.0 ppm lead concentration (MODERATE risk). Caution advised.",
                notification_type="risk_alert",
                is_read=True,
                created_at=now_utc - timedelta(days=12)
            )
            db.add_all([notif1, notif2, notif3])
            db.commit()
            print("[Seed] Added sample notifications.")
        else:
            print(f"[Seed] User already has {existing_tests} test records.")

    finally:
        if owns_session:
            db.close()

if __name__ == "__main__":
    seed_database()
