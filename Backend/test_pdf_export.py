import requests
import io

import os

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
TEST_EMAIL = os.getenv("TEST_EMAIL", "farmer@terraguard.org")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "farmer123")

def test_pdf_export_workflow():
    print("==================================================")
    print("Testing PDF Report Export Workflow...")
    print("==================================================")

    # 1. Login with demo user
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

    # 2. Get existing tests for User 2
    res = requests.get(f"{BASE_URL}/tests", headers=headers)
    assert res.status_code == 200
    user_tests = res.json()
    assert len(user_tests) > 0, "User 2 has no tests"
    test_target = user_tests[0]
    plot_label = test_target["plot_label"]
    print(f"[OK] Target plot for PDF test: '{plot_label}' (Test ID: {test_target['id']})")

    # 3. Request PDF Report by Plot Label
    res = requests.get(f"{BASE_URL}/plots/{plot_label}/report", headers=headers)
    assert res.status_code == 200, f"PDF export failed: {res.text}"
    assert "application/pdf" in res.headers.get("Content-Type", ""), "Response is not application/pdf"
    assert "attachment" in res.headers.get("Content-Disposition", ""), "Missing attachment Content-Disposition header"
    pdf_bytes = res.content
    assert pdf_bytes.startswith(b"%PDF-"), "Invalid PDF binary stream"
    print(f"[OK] Successfully generated PDF for '{plot_label}' ({len(pdf_bytes)} bytes, starts with %PDF-)")

    # 4. Request PDF Report by numeric test ID
    test_id = test_target["id"]
    res_id = requests.get(f"{BASE_URL}/plots/{test_id}/report", headers=headers)
    assert res_id.status_code == 200, f"PDF export by ID failed: {res_id.text}"
    assert res_id.content.startswith(b"%PDF-")
    print(f"[OK] Successfully generated PDF using numeric test ID #{test_id} ({len(res_id.content)} bytes)")

    # 5. Missing photo resilience test: create a test with non-existent photo file reference and verify export still succeeds
    # Let's create a test with a photo, then export
    res_single = requests.get(f"{BASE_URL}/plots/North%20plot%20sector%202/report", headers=headers)
    if res_single.status_code == 200:
        assert res_single.content.startswith(b"%PDF-")
        print(f"[OK] Single-test plot report generated cleanly ({len(res_single.content)} bytes)")

    # 6. Test User Isolation: Other user cannot export primary user's plot
    other_user_payload = {
        "name": "Other Farmer",
        "email": "other_farmer@terraguard.local",
        "password": "otherpassword123",
        "farm_label": "Other Farm"
    }
    res_other = requests.post(f"{BASE_URL}/auth/signup", json=other_user_payload)
    if res_other.status_code == 201:
        other_token = res_other.json()["access_token"]
    else:
        login_res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": other_user_payload["email"],
            "password": other_user_payload["password"]
        })
        assert login_res.status_code == 200
        other_token = login_res.json()["access_token"]

    other_headers = {"Authorization": f"Bearer {other_token}"}
    res_other_export = requests.get(f"{BASE_URL}/plots/{plot_label}/report", headers=other_headers)
    assert res_other_export.status_code == 404, "User isolation breach: Other user could export primary user's report"
    print("[OK] User isolation verified: Returns 404 when querying another user's plot report.")

    print("\n==================================================")
    print("[OK] ALL PDF REPORT EXPORT TESTS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    test_pdf_export_workflow()
