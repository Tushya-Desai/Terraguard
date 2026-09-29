from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, SoilTest
from ..schemas import PlotHistoryItem
from ..auth import get_current_user
from .tests_router import calculate_days_elapsed

router = APIRouter(prefix="/plots", tags=["Plot History & Trends"])

@router.get("/{plot_identifier}/history", response_model=List[PlotHistoryItem])
def get_plot_test_history(
    plot_identifier: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve historical soil lead tests for a specific plot belonging to the authenticated user.
    Results are returned sorted chronologically from oldest to newest.
    Accepts either a plot label string or a numeric test ID.
    """
    target_plot_label = plot_identifier

    # If numeric identifier is passed, lookup the test to resolve its plot label
    if plot_identifier.isdigit():
        test_by_id = db.query(SoilTest).filter(
            SoilTest.id == int(plot_identifier),
            SoilTest.user_id == current_user.id
        ).first()
        if test_by_id:
            target_plot_label = test_by_id.plot_label or f"Plot {test_by_id.id}"

    # Query all tests for this user matching the plot label, ordered chronologically
    tests = db.query(SoilTest).filter(
        SoilTest.user_id == current_user.id,
        SoilTest.plot_label == target_plot_label
    ).order_by(SoilTest.tested_at.asc()).all()

    # If no tests matched by label, but it was a numeric ID, fall back to that single test
    if not tests and plot_identifier.isdigit():
        single_test = db.query(SoilTest).filter(
            SoilTest.id == int(plot_identifier),
            SoilTest.user_id == current_user.id
        ).all()
        tests = single_test

    history_items: List[PlotHistoryItem] = []
    for t in tests:
        days = calculate_days_elapsed(t.remediation_start_date, t.remediation_active)
        formatted_date = t.tested_at.strftime("%b %d, %Y") if t.tested_at else ""

        history_items.append(
            PlotHistoryItem(
                id=t.id,
                plot_label=t.plot_label or target_plot_label,
                test_date=formatted_date,
                tested_at=t.tested_at,
                ppm_value=float(t.lead_concentration),
                lead_concentration=float(t.lead_concentration),
                risk_level=t.risk_level.lower(),
                remediation_active=t.remediation_active,
                days_elapsed=days
            )
        )

    return history_items

@router.get("/{plot_identifier}/report")
def export_plot_pdf_report(
    plot_identifier: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate and download an official PDF report for a plot's test history and remediation status.
    """
    import re
    from fastapi.responses import Response
    from ..pdf_service import generate_plot_pdf_report

    target_plot_label = plot_identifier

    # If numeric identifier is passed, lookup the test to resolve its plot label
    if plot_identifier.isdigit():
        test_by_id = db.query(SoilTest).filter(
            SoilTest.id == int(plot_identifier),
            SoilTest.user_id == current_user.id
        ).first()
        if test_by_id:
            target_plot_label = test_by_id.plot_label or f"Plot {test_by_id.id}"

    # Query all tests for this user matching the plot label, ordered chronologically
    tests = db.query(SoilTest).filter(
        SoilTest.user_id == current_user.id,
        SoilTest.plot_label == target_plot_label
    ).order_by(SoilTest.tested_at.asc()).all()

    # If no tests matched by label, but it was a numeric ID, fall back to that single test
    if not tests and plot_identifier.isdigit():
        single_test = db.query(SoilTest).filter(
            SoilTest.id == int(plot_identifier),
            SoilTest.user_id == current_user.id
        ).all()
        tests = single_test

    if not tests:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No soil test records found for plot '{target_plot_label}'."
        )

    pdf_bytes = generate_plot_pdf_report(current_user, target_plot_label, tests)
    safe_filename = re.sub(r'[^a-zA-Z0-9_\-]', '_', target_plot_label)
    filename = f"TerraGuard_Report_{safe_filename}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
