import requests
import json
import os

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
TEST_EMAIL = os.getenv("TEST_EMAIL", "farmer@terraguard.org")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "farmer123")

def test_full_api_workflow():
    print("\n--- 1. Testing Health & Root Endpoints ---")
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("Health check OK:", res.json())

    print("\n--- 2. Testing User Login with Demo Account ---")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    user = res.json()["user"]
    print(f"Logged in user: {user['name']} ({user['email']})")
    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 3. Testing Soil Tests List Endpoint ---")
    res = requests.get(f"{BASE_URL}/tests", headers=headers)
    assert res.status_code == 200, f"Tests retrieval failed: {res.text}"
    tests = res.json()
    print(f"Retrieved {len(tests)} soil tests.")
    for t in tests:
        print(f" - [{t['risk_level'].upper()}] {t['plot_label']} ({t['lead_concentration']} ppm), Remediation Active: {t['remediation_active']}, Days Elapsed: {t['days_elapsed']}")

    print("\n--- 4. Testing Remediation Toggle ---")
    test_to_toggle = tests[0]
    new_status = not test_to_toggle["remediation_active"]
    res = requests.patch(
        f"{BASE_URL}/tests/{test_to_toggle['id']}/remediation",
        json={"remediation_active": new_status},
        headers=headers
    )
    assert res.status_code == 200, f"Toggle failed: {res.text}"
    updated_test = res.json()
    print(f"Toggled remediation for '{updated_test['plot_label']}': {updated_test['remediation_active']} (Days elapsed: {updated_test['days_elapsed']})")

    # Toggle back to original state
    requests.patch(
        f"{BASE_URL}/tests/{test_to_toggle['id']}/remediation",
        json={"remediation_active": test_to_toggle["remediation_active"]},
        headers=headers
    )

    print("\n--- 5. Testing Heatmap Data Aggregation ---")
    res = requests.get(f"{BASE_URL}/tests/heatmap-data", headers=headers)
    assert res.status_code == 200, f"Heatmap data failed: {res.text}"
    heatmap_points = res.json()
    print(f"Heatmap data returned {len(heatmap_points)} points with GPS coordinates.")
    for p in heatmap_points:
        print(f" - Plot: {p['plot_label']}, Lat: {p['lat']}, Lng: {p['lng']}, Risk: {p['risk_level']}, Intensity: {p['intensity']}")

    print("\n--- 6. Testing Notifications Endpoint & Mark Read ---")
    res = requests.get(f"{BASE_URL}/notifications", headers=headers)
    assert res.status_code == 200, f"Notifications failed: {res.text}"
    notifs = res.json()
    print(f"User has {len(notifs)} notifications.")
    if len(notifs) > 0:
        first_notif = notifs[0]
        res = requests.patch(
            f"{BASE_URL}/notifications/{first_notif['id']}/read",
            json={"is_read": True},
            headers=headers
        )
        assert res.status_code == 200
        print(f"Marked notification #{first_notif['id']} as read.")

    print("\n=======================================================")
    print(" ALL BACKEND API ENDPOINTS & WORKFLOWS PASSED 100%! ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_api_workflow()
