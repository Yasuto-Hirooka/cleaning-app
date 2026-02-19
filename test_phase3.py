import requests
import sys
import datetime

BASE_URL = "http://127.0.0.1:8000/api"

def test_phase3():
    print("Testing Phase 3: Data Persistence & Reporting...")
    
    # 1. Fetch Staff and Rooms to get IDs
    print("Fetching Master Data...")
    staff = requests.get(f"{BASE_URL}/staff").json()
    rooms = requests.get(f"{BASE_URL}/rooms").json()
    
    if not staff or not rooms:
        print("Error: Master data missing.")
        sys.exit(1)
        
    s1 = staff[0]
    s2 = staff[1] if len(staff) > 1 else staff[0]
    r1 = rooms[0] # 701 (DB)
    r2 = rooms[1] # 702 (DB) usually
    
    print(f"Using Staff: {s1['name']}, {s2['name']}")
    print(f"Using Rooms: {r1['number']} ({r1['type']}), {r2['number']} ({r2['type']})")
    
    # 2. Create Cleaning Records
    print("Creating Cleaning Records...")
    today = datetime.date.today().isoformat()
    
    records = [
        {
            "date": today,
            "room_id": r1['id'],
            "bed_staff_id": s1['id'],
            "bath_staff_id": s2['id'],
            "towel_count": 1
        },
        {
            "date": today,
            "room_id": r2['id'],
            "bed_staff_id": s1['id'], # Same bed staff
            "bath_staff_id": s1['id'], # Same bath staff
            "towel_count": 0
        }
    ]
    
    res = requests.post(f"{BASE_URL}/records", json=records)
    if res.status_code != 200:
        print(f"Error saving records: {res.text}")
        sys.exit(1)
    print("Records saved successfully.")
    
    # 3. Get Daily Report
    print("Fetching Daily Report...")
    res = requests.get(f"{BASE_URL}/reports/daily?date={today}")
    if res.status_code != 200:
        print(f"Error fetching report: {res.text}")
        sys.exit(1)
        
    report = res.json()
    print("Report fetched.")
    
    # Verify s1 data
    # s1 did 2 beds (r1, r2) and 1 bath (r2)
    s1_stats = report.get(s1['name'])
    if not s1_stats:
        print(f"Error: Staff {s1['name']} not found in report.")
        sys.exit(1)
        
    print(f"Stats for {s1['name']}: {s1_stats}")
    
    # Verify Bed count
    # r1 is DB, r2 is likely DB (based on seed 701, 702 are DB)
    # Check if 'DB' exists in bed stats
    db_count = s1_stats['bed'].get('DB', 0)
    if db_count < 2:
         # It might be 0 if types are different, let's just check total
         total_bed = sum(s1_stats['bed'].values())
         if total_bed != 2:
             print(f"Error: Expected 2 beds for {s1['name']}, got {total_bed}")
             sys.exit(1)
    
    # Verify Towel Count
    # s1 was bed staff for r1 (towel=1) and r2 (towel=0). Total 1?
    # Logic in crud.py: "if r.towel_count > 0 and r.bed_staff_id ... report[s_name]['towel'] += r.towel_count"
    if s1_stats['towel'] != 1:
        print(f"Error: Expected 1 towel for {s1['name']}, got {s1_stats['towel']}")
        sys.exit(1)

    print("Phase 3 Backend Tests Passed!")

if __name__ == "__main__":
    test_phase3()
