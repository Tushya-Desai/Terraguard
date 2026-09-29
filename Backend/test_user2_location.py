import requests
import os
import io

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
TEST_EMAIL = os.getenv("TEST_EMAIL", "farmer@terraguard.org")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "farmer123")

def test_user2_workflow():
    print("==================================================")
    print("Testing Soil Test & Location Workflow...")
    print("==================================================")

    # 1. Login with test credentials
    login_payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    user = res.json()["user"]
    print(f"[OK] Successfully logged in as User #{user['id']}: {user['name']} ({user['email']})")
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check existing tests
    res = requests.get(f"{BASE_URL}/tests", headers=headers)
    assert res.status_code == 200
    existing_tests = res.json()
    print(f"[OK] Initial test count for User #{user['id']}: {len(existing_tests)}")

    # 3. Create a new soil test with coordinates from LocationPicker
    test_lat = 23.022505
    test_lng = 72.571362
    sample_svg = b'<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="green"/></svg>'
    
    files = {
        "photo": ("sample_test.svg", io.BytesIO(sample_svg), "image/svg+xml")
    }
    data = {
        "plot_label": "Ahmedabad Test Plot (North)",
        "lead_concentration": 42.5,
        "risk_level": "low",
        "latitude": test_lat,
        "longitude": test_lng,
        "remediation_active": "false"
    }

    res = requests.post(f"{BASE_URL}/tests", files=files, data=data, headers=headers)
    assert res.status_code == 201, f"Failed to create test: {res.text}"
    new_test = res.json()
    print(f"[OK] Created Soil Test #{new_test['id']}:")
    print(f"   - Plot: {new_test['plot_label']}")
    print(f"   - GPS: {new_test['latitude']}, {new_test['longitude']}")
    print(f"   - Lead: {new_test['lead_concentration']} ppm ({new_test['risk_level']})")
    assert abs(new_test["latitude"] - test_lat) < 0.0001, "Latitude mismatch"
    assert abs(new_test["longitude"] - test_lng) < 0.0001, "Longitude mismatch"

    # 4. Verify heatmap data includes the new GPS coordinates
    res = requests.get(f"{BASE_URL}/tests/heatmap-data", headers=headers)
    assert res.status_code == 200
    heatmap_points = res.json()
    matching_points = [p for p in heatmap_points if p["id"] == new_test["id"]]
    assert len(matching_points) == 1, "New test point missing in heatmap data"
    print(f"[OK] Heatmap aggregated point verified: {matching_points[0]['lat']}, {matching_points[0]['lng']}")

    # 5. Verify notifications
    res = requests.get(f"{BASE_URL}/notifications", headers=headers)
    assert res.status_code == 200
    print(f"[OK] Notifications endpoint functional. Total notifications: {len(res.json())}")

    print("\n==================================================")
    print("[OK] ALL USER 2 LOCATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_user2_workflow()
