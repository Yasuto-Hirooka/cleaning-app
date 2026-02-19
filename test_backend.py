import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def wait_for_server():
    for _ in range(10):
        try:
            requests.get("http://127.0.0.1:8000/docs")
            return True
        except requests.exceptions.ConnectionError:
            time.sleep(1)
    return False

def test_staff_endpoints():
    print("Testing Staff Endpoints...")
    # Get Staff (should be seeded)
    response = requests.get(f"{BASE_URL}/staff")
    if response.status_code != 200:
        print(f"Failed to get staff: {response.status_code} {response.text}")
    assert response.status_code == 200
    staff_list = response.json()
    print(f"Initial Staff Count: {len(staff_list)}")
    assert len(staff_list) == 10  # 10 initial staff
    assert any(s['name'] == 'ラマ' for s in staff_list)

    # Create Staff
    new_staff = {"name": "TestStaff"}
    response = requests.post(f"{BASE_URL}/staff", json=new_staff)
    assert response.status_code == 200
    created_staff = response.json()
    assert created_staff['name'] == "TestStaff"
    print("Staff created successfully.")

    # Delete Staff
    staff_id = created_staff['id']
    response = requests.delete(f"{BASE_URL}/staff/{staff_id}")
    assert response.status_code == 200
    print("Staff deleted successfully.")

def test_room_endpoints():
    print("Testing Room Endpoints...")
    # Get Rooms (should be seeded)
    response = requests.get(f"{BASE_URL}/rooms")
    assert response.status_code == 200
    room_list = response.json()
    print(f"Initial Room Count: {len(room_list)}")
    # Count check might be tedious to be exact, but let's check basic existence
    assert any(r['number'] == '701' for r in room_list)
    assert any(r['number'] == '1228' for r in room_list)

    # Create Room
    new_room = {"number": "9999", "type": "TEST", "floor": 1}
    response = requests.post(f"{BASE_URL}/rooms", json=new_room)
    assert response.status_code == 200
    created_room = response.json()
    assert created_room['number'] == "9999"
    print("Room created successfully.")

    # Delete Room
    room_id = created_room['id']
    response = requests.delete(f"{BASE_URL}/rooms/{room_id}")
    assert response.status_code == 200
    print("Room deleted successfully.")

if __name__ == "__main__":
    if not wait_for_server():
        print("Server failed to start.")
        sys.exit(1)
    
    try:
        test_staff_endpoints()
        test_room_endpoints()
        print("All backend tests passed!")
    except AssertionError as e:
        print(f"Test failed:Assertion error")
        # traceback is better but let's keep it simple
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
