import os
import io
from datetime import datetime, timezone
from typing import List, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    HRFlowable
)
from reportlab.graphics.shapes import Drawing, Rect, String

from .config import settings
from .models import User, SoilTest
from .routers.tests_router import calculate_days_elapsed

# Palette definitions matching TerraGuard
COLOR_PRIMARY = colors.HexColor("#2F5C3A")   # Brand Dark Green
COLOR_SECONDARY = colors.HexColor("#4C8C5C") # Brand Green
COLOR_ACCENT = colors.HexColor("#B8863B")    # Brand Gold
COLOR_BG_LIGHT = colors.HexColor("#FAF7F0")  # App base background
COLOR_TEXT = colors.HexColor("#22221E")      # Primary dark text
COLOR_MUTED = colors.HexColor("#6B6A63")     # Secondary muted text

COLOR_RISK_LOW = colors.HexColor("#3E9142")
COLOR_RISK_MOD = colors.HexColor("#E0A526")
COLOR_RISK_HIGH = colors.HexColor("#C24C3D")

def get_risk_color(risk_str: str):
    r = (risk_str or "").lower()
    if r == "high":
        return COLOR_RISK_HIGH
    elif r == "moderate":
        return COLOR_RISK_MOD
    return COLOR_RISK_LOW

def generate_plot_pdf_report(
    user: User,
    plot_label: str,
    tests: List[SoilTest]
) -> bytes:
    """
    Generate a clean, structured PDF report for a specific plot and its soil test history.
    Gracefully handles missing or invalid photos.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=COLOR_PRIMARY
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=COLOR_MUTED
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=COLOR_PRIMARY,
        spaceBefore=8,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=COLOR_TEXT
    )
    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=COLOR_PRIMARY
    )
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=COLOR_TEXT
    )

    story = []

    # 1. Header Banner
    now_str = datetime.now(timezone.utc).strftime("%B %d, %Y - %H:%M UTC")
    header_data = [
        [
            Paragraph(f"<b>TERRAGUARD</b> &bull; Soil Lead Assessment Report", subtitle_style),
            Paragraph(f"Generated: {now_str}", ParagraphStyle('RightMeta', parent=subtitle_style, alignment=2))
        ],
        [
            Paragraph(f"Plot: {plot_label}", title_style),
            Paragraph(f"Farmer: <b>{user.name}</b><br/>{user.farm_label or 'Registered Field'}", ParagraphStyle('RightFarmer', parent=body_style, alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[3.8 * inch, 3.4 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_SECONDARY, spaceBefore=6, spaceAfter=12))

    # Determine latest test data
    latest_test = tests[-1] if tests else None
    latest_ppm = f"{latest_test.lead_concentration:.1f} ppm" if latest_test else "N/A"
    latest_risk = (latest_test.risk_level if latest_test else "Unknown").upper()
    latest_risk_color = get_risk_color(latest_test.risk_level if latest_test else "low")
    remediation_active = latest_test.remediation_active if latest_test else False
    days_elapsed = calculate_days_elapsed(latest_test.remediation_start_date, remediation_active) if latest_test else 0
    gps_coords = f"{latest_test.latitude:.5f}, {latest_test.longitude:.5f}" if (latest_test and latest_test.latitude and latest_test.longitude) else "Not Specified"

    # 2. Executive Summary Metrics Box
    summary_data = [
        [
            Paragraph("<b>Current Lead Level</b>", bold_label),
            Paragraph("<b>Risk Classification</b>", bold_label),
            Paragraph("<b>Remediation Cycle</b>", bold_label),
            Paragraph("<b>GPS Coordinates</b>", bold_label)
        ],
        [
            Paragraph(f"<font size='13'><b>{latest_ppm}</b></font>", body_style),
            Paragraph(f"<font size='11' color='{latest_risk_color.hexval()}'><b>{latest_risk} RISK</b></font>", body_style),
            Paragraph(f"<b>{'Active' if remediation_active else 'Inactive'}</b> (Day {days_elapsed})" if remediation_active else "Inactive", body_style),
            Paragraph(f"<font name='Courier'>{gps_coords}</font>", body_style)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2DCD2")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2DCD2")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # 3. Middle Section: Reaction Photo (if available) + Plot Metadata
    photo_element = None
    if latest_test and latest_test.photo_path:
        full_photo_path = os.path.join(settings.UPLOAD_DIR, latest_test.photo_path)
        if os.path.exists(full_photo_path):
            try:
                ext = os.path.splitext(full_photo_path)[1].lower()
                if ext == ".svg":
                    from svglib.svglib import svg2rlg
                    drawing = svg2rlg(full_photo_path)
                    if drawing:
                        # Scale down drawing to fit nicely
                        scale = 160.0 / max(drawing.width, 1)
                        drawing.width = drawing.width * scale
                        drawing.height = drawing.height * scale
                        drawing.scale(scale, scale)
                        photo_element = drawing
                else:
                    # JPEG / PNG image
                    img = Image(full_photo_path, width=2.4 * inch, height=1.6 * inch)
                    img.hAlign = 'CENTER'
                    photo_element = img
            except Exception as e:
                print(f"[PDF Export Warning] Could not render photo {full_photo_path}: {e}")
                photo_element = None

    # Side-by-side: Photo on left/right, Recommendations & Guidelines on the other
    recom_text = ""
    if latest_test and latest_test.risk_level == "high":
        recom_text = "<b>High Lead Risk Detected (&gt;400 ppm):</b> Soil lead concentration exceeds safe agricultural safety limits. Active bio-remediation / soil conditioning is strongly advised before planting food crops. Re-test after 30 days."
    elif latest_test and latest_test.risk_level == "moderate":
        recom_text = "<b>Moderate Lead Risk (200–400 ppm):</b> Caution advised for root crops and leafy vegetables. Monitor soil amendments and conduct periodic follow-up tests."
    else:
        recom_text = "<b>Optimal / Safe Range (&lt;200 ppm):</b> Soil lead levels fall within acceptable standards for agricultural production. Continue standard soil health maintenance."

    rec_cell = [
        Paragraph("<b>Actionable Recommendations</b>", bold_label),
        Spacer(1, 4),
        Paragraph(recom_text, body_style),
        Spacer(1, 6),
        Paragraph(f"<b>Total Sample History:</b> {len(tests)} test(s) logged for this plot.", subtitle_style)
    ]

    if photo_element:
        photo_cell = [
            Paragraph("<b>Latest Reaction Photo</b>", bold_label),
            Spacer(1, 4),
            photo_element
        ]
        mid_table = Table([[rec_cell, photo_cell]], colWidths=[4.4 * inch, 2.8 * inch])
        mid_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(mid_table)
    else:
        story.append(Paragraph("<b>Actionable Recommendations</b>", bold_label))
        story.append(Spacer(1, 4))
        story.append(Paragraph(recom_text, body_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 12))

    # 4. Chronological Soil Test Records Table
    story.append(Paragraph("Chronological Soil Test History", section_heading))
    story.append(Spacer(1, 4))

    table_rows = [
        [
            Paragraph("<b>#</b>", table_header_style),
            Paragraph("<b>Test Date</b>", table_header_style),
            Paragraph("<b>Lead (ppm)</b>", table_header_style),
            Paragraph("<b>Risk Classification</b>", table_header_style),
            Paragraph("<b>Remediation State</b>", table_header_style),
            Paragraph("<b>GPS Point</b>", table_header_style)
        ]
    ]

    for idx, t in enumerate(tests, start=1):
        t_date = t.tested_at.strftime("%b %d, %Y") if t.tested_at else "—"
        r_color = get_risk_color(t.risk_level)
        r_label = f"<font color='{r_color.hexval()}'><b>{t.risk_level.upper()}</b></font>"
        rem_state = "Active" if t.remediation_active else "Inactive"
        gps = f"{t.latitude:.4f}, {t.longitude:.4f}" if (t.latitude and t.longitude) else "—"

        table_rows.append([
            Paragraph(str(idx), table_cell_style),
            Paragraph(t_date, table_cell_style),
            Paragraph(f"<b>{t.lead_concentration:.1f}</b> ppm", table_cell_style),
            Paragraph(r_label, table_cell_style),
            Paragraph(rem_state, table_cell_style),
            Paragraph(f"<font name='Courier' size='7.5'>{gps}</font>", table_cell_style)
        ])

    history_table = Table(
        table_rows,
        colWidths=[0.4 * inch, 1.4 * inch, 1.2 * inch, 1.4 * inch, 1.3 * inch, 1.5 * inch]
    )
    history_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, COLOR_BG_LIGHT]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2DCD2")),
    ]))
    story.append(history_table)

    story.append(Spacer(1, 14))

    # 5. Safety Standard Reference Legend & Footer Note
    legend_text = (
        "<b>Safety Threshold Reference:</b> Safe: &lt;200 ppm | Moderate: 200–400 ppm | High Danger: &gt;400 ppm. "
        "This official summary report is generated from the TerraGuard Soil Lead Detection & Remediation Tracking System."
    )
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#D1CBC1"), spaceBefore=4, spaceAfter=6))
    story.append(Paragraph(legend_text, subtitle_style))

    # Build document
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
