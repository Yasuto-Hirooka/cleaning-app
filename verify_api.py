import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print(f"Testing API at {BASE_URL}")

    # 1. Test Root
    try:
        resp = requests.get(f"{BASE_URL}/")
        print(f"GET /: {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
        sys.exit(1)

    # 2. Create Room
    room_data = {"room_number": "101", "room_type": "Single"}
    resp = requests.post(f"{BASE_URL}/rooms", json=room_data)
    print(f"POST /rooms: {resp.status_code} - {resp.json()}")

    # 3. Get Rooms
    resp = requests.get(f"{BASE_URL}/rooms")
    print(f"GET /rooms: {resp.status_code} - {resp.json()}")
    
    rooms = resp.json()
    if not any(r['room_number'] == "101" for r in rooms):
        print("ERROR: Created room 101 not found in list")

    # 4. Create Staff
    staff_data = {"name": "Tanaka"}
    resp = requests.post(f"{BASE_URL}/staff", json=staff_data)
    print(f"POST /staff: {resp.status_code} - {resp.json()}")

    # 5. Get Staff
    resp = requests.get(f"{BASE_URL}/staff")
    print(f"GET /staff: {resp.status_code} - {resp.json()}")

    staff = resp.json()
    if not any(s['name'] == "Tanaka" for s in staff):
        print("ERROR: Created staff Tanaka not found in list")

if __name__ == "__main__":
    test_api()
