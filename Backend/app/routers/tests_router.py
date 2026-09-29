import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models import User, SoilTest, Notification
from ..schemas import SoilTestResponse, RemediationToggleRequest, HeatmapPoint
from ..auth import get_current_user

router = APIRouter(prefix="/tests", tags=["Soil Tests"])

def determine_risk_level(concentration: float) -> str:
    """Classify lead concentration (ppm) into risk level according to safety thresholds (Low <200, Moderate 200-400, High >400)."""
    if concentration < 200:
        return "low"
    elif concentration <= 400:
        return "moderate"
    else:
        return "high"

def calculate_days_elapsed(start_date: Optional[datetime], is_active: bool) -> int:
    """Calculate elapsed remediation days server-side."""
    if not start_date or not is_active:
        return 0
    # Ensure timezone-aware comparison
    now = datetime.now(timezone.utc)
    if start_date.tzinfo is None:
        start_tz = start_date.replace(tzinfo=timezone.utc)
    else:
        start_tz = start_date
    delta = (now - start_tz).days
    return max(0, delta)

def format_test_response(test: SoilTest, request: Optional[Request] = None) -> SoilTestResponse:
    """Construct full SoilTestResponse schema with calculated fields."""
    days = calculate_days_elapsed(test.remediation_start_date, test.remediation_active)
    
    # Generate relative/absolute photo URL
    base_url = str(request.base_url).rstrip("/") if request else ""
    photo_url = f"{base_url}/uploads/{test.photo_path}" if test.photo_path else ""

    return SoilTestResponse(
        id=test.id,
        user_id=test.user_id,
        plot_label=test.plot_label or "Plot 1",
        latitude=test.latitude,
        longitude=test.longitude,
        photo_path=test.photo_path,
        photo_url=photo_url,
        lead_concentration=test.lead_concentration,
        risk_level=test.risk_level.lower(),
        remediation_active=test.remediation_active,
        remediation_start_date=test.remediation_start_date,
        days_elapsed=days,
        tested_at=test.tested_at,
        created_at=test.created_at
    )

@router.get("", response_model=List[SoilTestResponse])
def get_user_tests(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all soil test records for the authenticated user."""
    tests = db.query(SoilTest).filter(
        SoilTest.user_id == current_user.id
    ).order_by(SoilTest.tested_at.desc()).all()

    return [format_test_response(t, request) for t in tests]

@router.post("", response_model=SoilTestResponse, status_code=status.HTTP_201_CREATED)
async def create_soil_test(
    request: Request,
    photo: UploadFile = File(...),
    plot_label: Optional[str] = Form("Plot 1"),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    lead_concentration: float = Form(...),
    risk_level: Optional[str] = Form(None),
    remediation_active: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new soil test record with uploaded reaction image."""
    # Determine risk level if not explicitly provided
    computed_risk = risk_level.lower().strip() if risk_level else determine_risk_level(lead_concentration)
    if computed_risk not in ["low", "moderate", "high"]:
        computed_risk = determine_risk_level(lead_concentration)

    # Save photo file securely
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    extension = os.path.splitext(photo.filename or "")[1] or ".jpg"
    unique_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        content = await photo.read()
        buffer.write(content)

    # Remediation start date logic
    now_utc = datetime.now(timezone.utc)
    start_date = now_utc if remediation_active else None

    # Create SoilTest record
    new_test = SoilTest(
        user_id=current_user.id,
        plot_label=plot_label.strip() if plot_label else "Plot 1",
        latitude=latitude,
        longitude=longitude,
        photo_path=unique_filename,
        lead_concentration=lead_concentration,
        risk_level=computed_risk,
        remediation_active=remediation_active,
        remediation_start_date=start_date,
        tested_at=now_utc,
        created_at=now_utc
    )
    db.add(new_test)
    db.commit()
    db.refresh(new_test)

    # PRD 4.3 Trigger: Create notification if risk level is Moderate or High
    if computed_risk in ["moderate", "high"]:
        alert_title = f"{computed_risk.capitalize()} Lead Risk Detected"
        alert_msg = (
            f"Soil test at '{new_test.plot_label}' recorded {lead_concentration} ppm lead concentration "
            f"({computed_risk.upper()} risk). Immediate soil remediation is recommended."
            if computed_risk == "high" else
            f"Soil test at '{new_test.plot_label}' recorded {lead_concentration} ppm lead concentration "
            f"(MODERATE risk). Caution advised; consider soil conditioning."
        )
        notif = Notification(
            user_id=current_user.id,
            test_id=new_test.id,
            title=alert_title,
            message=alert_msg,
            notification_type="risk_alert",
            is_read=False,
            created_at=now_utc
        )
        db.add(notif)
        db.commit()

    return format_test_response(new_test, request)

@router.get("/heatmap-data", response_model=List[HeatmapPoint])
def get_heatmap_data(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve GPS test points formatted for React-Leaflet heatmap generation."""
    tests = db.query(SoilTest).filter(
        SoilTest.user_id == current_user.id,
        SoilTest.latitude.isnot(None),
        SoilTest.longitude.isnot(None)
    ).all()

    base_url = str(request.base_url).rstrip("/")
    points = []
    for t in tests:
        # Intensity mapping for heatmap layering
        if t.risk_level == "high":
            intensity = 1.0
        elif t.risk_level == "moderate":
            intensity = 0.65
        else:
            intensity = 0.35

        photo_url = f"{base_url}/uploads/{t.photo_path}" if t.photo_path else ""

        points.append(
            HeatmapPoint(
                id=t.id,
                plot_label=t.plot_label or "Plot",
                lat=t.latitude,
                lng=t.longitude,
                intensity=intensity,
                risk_level=t.risk_level,
                lead_concentration=t.lead_concentration,
                photo_url=photo_url
            )
        )
    return points

@router.get("/{test_id}", response_model=SoilTestResponse)
def get_test_detail(
    test_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve single soil test record detail."""
    test = db.query(SoilTest).filter(
        SoilTest.id == test_id,
        SoilTest.user_id == current_user.id
    ).first()

    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soil test record not found"
        )

    return format_test_response(test, request)

@router.patch("/{test_id}/remediation", response_model=SoilTestResponse)
def toggle_remediation(
    test_id: int,
    payload: RemediationToggleRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle remediation on/off for a soil test record."""
    test = db.query(SoilTest).filter(
        SoilTest.id == test_id,
        SoilTest.user_id == current_user.id
    ).first()

    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Soil test record not found"
        )

    now_utc = datetime.now(timezone.utc)
    test.remediation_active = payload.remediation_active

    if payload.remediation_active:
        # PRD 4.5: Toggling ON sets a remediation_start_date if not already set
        if not test.remediation_start_date:
            test.remediation_start_date = now_utc
    else:
        # PRD 4.5: Toggling OFF retains the historical start date
        pass

    db.commit()
    db.refresh(test)

    # PRD 4.3 Trigger check: If remediation reaches threshold (e.g. 30 days), create a notification
    days = calculate_days_elapsed(test.remediation_start_date, test.remediation_active)
    if test.remediation_active and days >= 30:
        existing_milestone = db.query(Notification).filter(
            Notification.test_id == test.id,
            Notification.notification_type == "remediation_milestone"
        ).first()
        if not existing_milestone:
            notif = Notification(
                user_id=current_user.id,
                test_id=test.id,
                title="Remediation Milestone Reached (Day 30)",
                message=f"Remediation for '{test.plot_label}' has reached 30 days. It is time to re-test the soil lead levels.",
                notification_type="remediation_milestone",
                is_read=False,
                created_at=now_utc
            )
            db.add(notif)
            db.commit()

    return format_test_response(test, request)
