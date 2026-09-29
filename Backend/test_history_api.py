import requests
import io
from datetime import datetime, timedelta, timezone

import os

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

def test_plot_history_feature():
    print("==================================================")
    print("Testing Plot History & Trend API Workflow...")
    print("==================================================")

    # 1. Sign up or login with a dedicated test user
    test_user_payload = {
        "name": "Trend Tester",
        "email": "trend_tester@terraguard.local",
        "password": "testpassword123",
        "farm_label": "Testing Acre"
    }
    signup_res = requests.post(f"{BASE_URL}/auth/signup", json=test_user_payload)
    if signup_res.status_code == 201:
        token = signup_res.json()["access_token"]
        user = signup_res.json()["user"]
    else:
        login_res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": test_user_payload["email"],
            "password": test_user_payload["password"]
        })
        assert login_res.status_code == 200, f"Auth failed: {login_res.text}"
        token = login_res.json()["access_token"]
        user = login_res.json()["user"]

    print(f"[OK] Authenticated as User #{user['id']}: {user['name']}")
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Query tests list
    res = requests.get(f"{BASE_URL}/tests", headers=headers)
    assert res.status_code == 200
    user_tests = res.json()
    print(f"[OK] User #{user['id']} has {len(user_tests)} existing tests.")

    # 3. Create a follow-up test for "Ahmedabad Test Plot (North)" to test 2+ data points trend
    plot_name = "Ahmedabad Test Plot (North)"
    sample_svg = b'<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="orange"/></svg>'
    files = {
        "photo": ("followup_test.svg", io.BytesIO(sample_svg), "image/svg+xml")
    }
    data = {
        "plot_label": plot_name,
        "lead_concentration": 28.0, # Reduced from 42.5
        "risk_level": "low",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "remediation_active": "true"
    }
    res = requests.post(f"{BASE_URL}/tests", files=files, data=data, headers=headers)
    assert res.status_code == 201, f"Failed to create follow-up test: {res.text}"
    new_test = res.json()
    print(f"[OK] Created follow-up test #{new_test['id']} for '{plot_name}' with {new_test['lead_concentration']} ppm")

    # 4. Test GET /plots/{plot_identifier}/history by plot label
    res = requests.get(f"{BASE_URL}/plots/{plot_name}/history", headers=headers)
    assert res.status_code == 200, f"History fetch failed: {res.text}"
    history_by_label = res.json()
    print(f"[OK] GET /plots/{plot_name}/history returned {len(history_by_label)} records:")
    for h in history_by_label:
        print(f"     - Test #{h['id']} on {h['test_date']}: {h['ppm_value']} ppm ({h['risk_level']})")
    
    assert len(history_by_label) >= 2, "Expected at least 2 historical tests for trend"
    # Verify chronological sorting (oldest first)
    dates = [datetime.fromisoformat(h["tested_at"].replace("Z", "+00:00")) for h in history_by_label]
    assert dates == sorted(dates), "Records are not sorted oldest to newest!"

    # 5. Test GET /plots/{plot_identifier}/history by test ID
    test_id = new_test["id"]
    res = requests.get(f"{BASE_URL}/plots/{test_id}/history", headers=headers)
    assert res.status_code == 200, f"History by test_id failed: {res.text}"
    history_by_id = res.json()
    assert len(history_by_id) == len(history_by_label), "History by test ID does not match history by label"
    print(f"[OK] GET /plots/{test_id}/history resolved correctly to '{history_by_id[0]['plot_label']}'")

    # 6. Test GET /api/plots/{plot_identifier}/history alias
    res = requests.get(f"{BASE_URL}/api/plots/{plot_name}/history", headers=headers)
    assert res.status_code == 200
    print("[OK] GET /api/plots/... alias route confirmed.")

    # 7. Test User Isolation (Demo user 1 should NOT see User 2's plot history)
    login_demo = {
        "email": "farmer@terraguard.org",
        "password": "farmer123"
    }
    res_demo = requests.post(f"{BASE_URL}/auth/login", json=login_demo)
    demo_headers = {"Authorization": f"Bearer {res_demo.json()['access_token']}"}
    res_isolated = requests.get(f"{BASE_URL}/plots/{plot_name}/history", headers=demo_headers)
    assert res_isolated.status_code == 200
    assert len(res_isolated.json()) == 0, "Security isolation failed! Demo user saw User 2's data."
    print("[OK] Security & user isolation verified: User data is strictly segregated.")

    print("\n==================================================")
    print("[OK] ALL HISTORICAL TREND CHART API TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_plot_history_feature()
