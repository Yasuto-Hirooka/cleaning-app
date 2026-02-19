import requests
import sys
import datetime

BASE_URL = "http://127.0.0.1:8000/api"

def test_phase4():
    print("Testing Phase 4: Vendor Reporting...")
    
    # 1. Fetch Staff and Rooms
    print("Fetching Master Data...")
    staff = requests.get(f"{BASE_URL}/staff").json()
    rooms = requests.get(f"{BASE_URL}/rooms").json()
    
    if not staff or not rooms:
        print("Error: Master data missing.")
        sys.exit(1)
        
    # Identify Staff
    s_inhouse = next((s for s in staff if s['name'] == "自社"), None)
    s_vendor = next((s for s in staff if s['name'] == "ラマ"), None) # Vendor
    
    if not s_inhouse or not s_vendor:
        print("Error: Could not find '自社' or 'ラマ' in staff list.")
        sys.exit(1)
        
    print(f"In-House ID: {s_inhouse['id']}, Vendor ID: {s_vendor['id']}")
    
    # Identify Rooms (Different Floors)
    r_7f = next((r for r in rooms if r['floor'] == 7 and r['type'] == 'DB'), None)
    r_8f = next((r for r in rooms if r['floor'] == 8 and r['type'] == 'TW'), None)
    r_9f = next((r for r in rooms if r['floor'] == 9), None) # For D.D test
    
    if not r_7f or not r_8f or not r_9f:
        print("Error: Could not find test rooms.")
        sys.exit(1)

    today = datetime.date.today().isoformat()
    
    # 2. Create Records for Testing Logic
    print("Creating Test Records...")
    records = [
        # Case 1: Full Vendor (Bed+Bath) -> Should be 1.0 points
        {
            "date": today,
            "room_id": r_7f['id'],
            "bed_staff_id": s_vendor['id'],
            "bath_staff_id": s_vendor['id'],
            "towel_count": 0
        },
        # Case 2: Mixed (Bed=Vendor, Bath=InHouse) -> Should be 0.5 points
        {
            "date": today,
            "room_id": r_8f['id'],
            "bed_staff_id": s_vendor['id'],
            "bath_staff_id": s_inhouse['id'],
            "towel_count": 0
        },
        # Case 3: D.D (Towel Only) by Vendor -> Should be 1.0 points
        {
            "date": today,
            "room_id": r_9f['id'],
            "bed_staff_id": s_vendor['id'],
            "bath_staff_id": None, 
            "towel_count": 1 # D.D
        },
        # Case 4: Full InHouse -> Should be 0.0 points
        {
            "date": today,
            "room_id": rooms[3]['id'], # Arbitrary room
            "bed_staff_id": s_inhouse['id'],
            "bath_staff_id": s_inhouse['id'],
            "towel_count": 0
        }
    ]
    
    # Save records (this overwrites if exists logic in crud or append? 
    # crud uses update if exists. So we are good.)
    res = requests.post(f"{BASE_URL}/records", json=records)
    if res.status_code != 200:
        print(f"Error saving records: {res.text}")
        sys.exit(1)
        
    print("Records saved.")
    
    # 3. Fetch Vendor Report
    print("Fetching Vendor Report...")
    res = requests.get(f"{BASE_URL}/reports/vendor?date={today}")
    if res.status_code != 200:
        print(f"Error fetching vendor report: {res.text}")
        sys.exit(1)
        
    report = res.json()
    print("Vendor Report fetched.")
    # import json
    # print(json.dumps(report, indent=2))
    
    # 4. Verify Logic
    
    # Verify Case 1 (7F, DB, 1.0)
    stats_7f = report.get(str(r_7f['floor']))
    if not stats_7f:
         print(f"Error: No stats for floor {r_7f['floor']}")
         sys.exit(1)
    
    pts_7f_db = stats_7f.get('DB', 0)
    # Note: If other records exist for 7F DB from previous tests, this might be > 1.0.
    # We should restart DB or check "at least 1.0".
    # Since I reset DB in previous step (del hotel_app.db), it should be clean? 
    # No, I reset it WAY back. Phase 3 test added records.
    # Phase 3 test added: 701 (DB) -> Bed: s1(Vendor), Bath: s2(Vendor).
    # Wait, s1 was "ラマ", s2 was "バビタ". Both are Vendors.
    # So Phase 3 test already added 1.0 point to 7F DB.
    # Now valid test adds ANOTHER 1.0 point. Total should be 2.0?
    # Or updated? crud.py logic: "if existing... update".
    # Phase 3 test used r1 (701).
    # This test uses r_7f (Rooms[0] -> 701).
    # So it updates the SAME record.
    # Phase 3 test: Bed=s1, Bath=s2. Both Vendor (if s1/s2 are Rama/Babita).
    # This test: Bed=s_vendor (Rama), Bath=s_vendor (Rama).
    # So it updates to Bed=Rama, Bath=Rama. Points should correspond to that.
    # Result: 1.0 point.
    
    if pts_7f_db < 1.0:
        print(f"Error: Expected at least 1.0 for 7F DB, got {pts_7f_db}")
        sys.exit(1)
        
    # Verify Case 2 (8F, TW, 0.5)
    # 8F had no previous records in Phase 3 test (Phase 3 used 701, 702 - both 7F).
    stats_8f = report.get(str(r_8f['floor']))
    if not stats_8f:
         print(f"Error: No stats for floor {r_8f['floor']}")
         sys.exit(1)
         
    pts_8f_tw = stats_8f.get('TW', 0)
    if pts_8f_tw != 0.5:
        print(f"Error: Expected 0.5 for 8F TW, got {pts_8f_tw}")
        sys.exit(1)

    # Verify Case 3 (9F, D.D, 1.0)
    stats_9f = report.get(str(r_9f['floor']))
    # The category key for D.D is "D・D"
    pts_9f_dd = stats_9f.get('D・D', 0)
    if pts_9f_dd != 1.0:
        print(f"Error: Expected 1.0 for 9F D・D, got {pts_9f_dd}")
        sys.exit(1)

    print("Phase 4 Vendor Report Tests Passed!")

if __name__ == "__main__":
    test_phase4()
