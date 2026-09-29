import requests
import io
import random

import os

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
TEST_EMAIL = os.getenv("TEST_EMAIL", "farmer@terraguard.org")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "farmer123")

def test_autofill_submission_workflow():
    print("==================================================")
    print("Testing Autofill Demo Data Submission Workflow...")
    print("==================================================")

    # 1. Login with test user
    login_payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    user = res.json()["user"]
    print(f"[OK] Authenticated as User #{user['id']}: {user['name']}")
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Simulate Autofilled Data payload across different tiers
    demo_plots = ["Backyard Garden Test - 55", "Greenhouse Bed 1 - 82", "Sector 7 Organic Field - 19"]
    
    for plot_name in demo_plots:
        ppm_val = round(random.uniform(25.0, 520.0), 1)
        risk = "low" if ppm_val < 200 else ("moderate" if ppm_val <= 400 else "high")
        rem_active = random.choice([True, False])
        lat = round(22.9734 + random.uniform(-0.02, 0.02), 6)
        lng = round(78.6569 + random.uniform(-0.02, 0.02), 6)

        sample_svg = f'<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="{risk}"/></svg>'.encode('utf-8')
        files = {
            "photo": (f"demo_reaction_{risk}.svg", io.BytesIO(sample_svg), "image/svg+xml")
        }
        data = {
            "plot_label": plot_name,
            "lead_concentration": ppm_val,
            "risk_level": risk,
            "latitude": lat,
            "longitude": lng,
            "remediation_active": str(rem_active).lower()
        }

        res = requests.post(f"{BASE_URL}/tests", files=files, data=data, headers=headers)
        assert res.status_code == 201, f"Failed to submit autofilled test: {res.text}"
        created = res.json()
        print(f"[OK] Successfully submitted Autofilled Test #{created['id']}:")
        print(f"     - Plot: {created['plot_label']}")
        print(f"     - Lead: {created['lead_concentration']} ppm ({created['risk_level'].upper()})")
        print(f"     - Coordinates: {created['latitude']}, {created['longitude']}")
        print(f"     - Remediation Active: {created['remediation_active']}")

        # Verify PDF report generation works for the newly autofilled test
        res_pdf = requests.get(f"{BASE_URL}/plots/{created['id']}/report", headers=headers)
        assert res_pdf.status_code == 200
        assert res_pdf.content.startswith(b"%PDF-")

    print("\n==================================================")
    print("[OK] ALL AUTOFILL SUBMISSION & EXPORT TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_autofill_submission_workflow()
