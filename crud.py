from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException
import models, schemas

def get_staff(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Staff).offset(skip).limit(limit).all()

def create_staff(db: Session, staff: schemas.StaffCreate):
    db_staff = models.Staff(name=staff.name)
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

def delete_staff(db: Session, staff_id: int):
    staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if staff:
        db.delete(staff)
        db.commit()
        return True
    return False

def get_rooms(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Room).offset(skip).limit(limit).all()

def get_raw_records(db: Session, date: str):
    return db.query(models.CleaningRecord).filter(models.CleaningRecord.date == date).all()

def create_room(db: Session, room: schemas.RoomCreate):
    db_room = models.Room(number=room.number, type=room.type, floor=room.floor)
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

def delete_room(db: Session, room_id: int):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if room:
        db.delete(room)
        db.commit()
        return True
    return False

def seed_data(db: Session):
    # Staff Seeding
    staff_names = ["ラマ", "バビタ", "ディパ", "リタ", "リラ", "シタ", "ラメス", "スニム", "ヒマル", "自社"]
    if db.query(models.Staff).count() == 0:
        for name in staff_names:
            db.add(models.Staff(name=name))
        db.commit()

    # Room Seeding
    # 7F: 701-712(DB), 713(TRP), 714-721(TW), 722-726(DB), 727(TW)
    room_data = []

    # Helper function to add rooms
    def add_rooms(floor, start, end, type_):
        for i in range(start, end + 1):
            room_data.append({"number": str(i), "type": type_, "floor": floor})
    
    # 7F
    if db.query(models.Room).filter(models.Room.floor == 7).count() == 0:
        add_rooms(7, 701, 712, "DB")
        room_data.append({"number": "713", "type": "TRP", "floor": 7})
        add_rooms(7, 714, 721, "TW")
        add_rooms(7, 722, 726, "DB")
        room_data.append({"number": "727", "type": "TW", "floor": 7})
    
    # 8F: 801-803(DB), 805(TW), 806-814(DB), 815(TRP), 816-823(TW), 824-828(DB), 829(TW)
    if db.query(models.Room).filter(models.Room.floor == 8).count() == 0:
        add_rooms(8, 801, 803, "DB")
        room_data.append({"number": "805", "type": "TW", "floor": 8})
        add_rooms(8, 806, 814, "DB")
        room_data.append({"number": "815", "type": "TRP", "floor": 8})
        add_rooms(8, 816, 823, "TW")
        add_rooms(8, 824, 828, "DB")
        room_data.append({"number": "829", "type": "TW", "floor": 8})

    # 9F: 901-903(DB), 905(TW), 906-914(DB), 915(TRP), 916-918(TW), 919-920(DB), 921-923(TW), 924(DB), 925(TW), 926-928(DB), 929(TW)
    if db.query(models.Room).filter(models.Room.floor == 9).count() == 0:
        add_rooms(9, 901, 903, "DB")
        room_data.append({"number": "905", "type": "TW", "floor": 9})
        add_rooms(9, 906, 914, "DB")
        room_data.append({"number": "915", "type": "TRP", "floor": 9})
        add_rooms(9, 916, 918, "TW")
        add_rooms(9, 919, 920, "DB")
        add_rooms(9, 921, 923, "TW")
        room_data.append({"number": "924", "type": "DB", "floor": 9})
        room_data.append({"number": "925", "type": "TW", "floor": 9})
        add_rooms(9, 926, 928, "DB")
        room_data.append({"number": "929", "type": "TW", "floor": 9})

    # 10F: 1001-1003(DB), 1005(TW), 1006-1014(DB), 1015(TRP), 1016-1023(TW), 1024-1028(DB), 1029(TW)
    if db.query(models.Room).filter(models.Room.floor == 10).count() == 0:
        add_rooms(10, 1001, 1003, "DB")
        room_data.append({"number": "1005", "type": "TW", "floor": 10})
        add_rooms(10, 1006, 1014, "DB")
        room_data.append({"number": "1015", "type": "TRP", "floor": 10})
        add_rooms(10, 1016, 1023, "TW")
        add_rooms(10, 1024, 1028, "DB")
        room_data.append({"number": "1029", "type": "TW", "floor": 10})

    # 11F: 1101-1103(DB), 1105(TW), 1106-1114(DB), 1115(TRP), 1116-1118(TW), 1119-1120(DB), 1121-1123(TW), 1124(DB), 1125(TW), 1126-1128(DB), 1129(TW)
    if db.query(models.Room).filter(models.Room.floor == 11).count() == 0:
        add_rooms(11, 1101, 1103, "DB")
        room_data.append({"number": "1105", "type": "TW", "floor": 11})
        add_rooms(11, 1106, 1114, "DB")
        room_data.append({"number": "1115", "type": "TRP", "floor": 11})
        add_rooms(11, 1116, 1118, "TW")
        add_rooms(11, 1119, 1120, "DB")
        add_rooms(11, 1121, 1123, "TW")
        room_data.append({"number": "1124", "type": "DB", "floor": 11})
        room_data.append({"number": "1125", "type": "TW", "floor": 11})
        add_rooms(11, 1126, 1128, "DB")
        room_data.append({"number": "1129", "type": "TW", "floor": 11})

    # 12F: 1201-1203(DB), 1205(TW), 1206-1214(DB), 1215(TRP), 1216-1218(TW), 1219-1220(DB), 1221-1223(TW), 1224(DB), 1225(TW), 1226(DB), 1227(SW), 1228(DB)
    if db.query(models.Room).filter(models.Room.floor == 12).count() == 0:
        add_rooms(12, 1201, 1203, "DB")
        room_data.append({"number": "1205", "type": "TW", "floor": 12})
        add_rooms(12, 1206, 1214, "DB")
        room_data.append({"number": "1215", "type": "TRP", "floor": 12})
        add_rooms(12, 1216, 1218, "TW")
        add_rooms(12, 1219, 1220, "DB")
        add_rooms(12, 1221, 1223, "TW")
        room_data.append({"number": "1224", "type": "DB", "floor": 12})
        room_data.append({"number": "1225", "type": "TW", "floor": 12})
        room_data.append({"number": "1226", "type": "DB", "floor": 12})
        room_data.append({"number": "1227", "type": "SW", "floor": 12})
        room_data.append({"number": "1228", "type": "DB", "floor": 12})

    for r in room_data:
        # Check if room already exists to avoid duplicates if partial seed failed?
        # Assuming clean DB for now based on logic structure
        if db.query(models.Room).filter(models.Room.number == r["number"]).first() is None:
            db.add(models.Room(number=r["number"], type=r["type"], floor=r["floor"]))
    
    db.commit()

def create_cleaning_records(db: Session, records: List[schemas.CleaningRecordCreate], target_date: str = None):
    # If target_date is not provided, try to get it from the first record
    if not target_date and records:
        target_date = records[0].date
    
    if not target_date:
        return {"message": "No date provided to save/reset records"}

    year_month = target_date[:7] # YYYY-MM

    # 1. Check if month is locked
    if is_month_locked(db, year_month):
        raise HTTPException(status_code=403, detail=f"Month {year_month} is locked. Cannot save records.")

    # 2. Check if day is locked
    if is_day_locked(db, target_date):
        raise HTTPException(status_code=403, detail=f"Date {target_date} is locked. Cannot save records.")

    # 2. Overwrite logic: Delete existing records for this date
    db.query(models.CleaningRecord).filter(models.CleaningRecord.date == target_date).delete()
    db.commit()

    # 3. Insert new records
    for rec in records:
        data = rec.model_dump() if hasattr(rec, 'model_dump') else rec.dict()
        if "status" not in data:
            data["status"] = "draft"
        db_rec = models.CleaningRecord(**data)
        db.add(db_rec)
    db.commit()
    return {"message": f"Successfully saved {len(records)} records for {target_date}"}

def get_daily_report(db: Session, date: str):
    records = db.query(models.CleaningRecord).filter(models.CleaningRecord.date == date).all()
    staffs = db.query(models.Staff).all()
    rooms = db.query(models.Room).all()
    
    room_map = {r.id: r for r in rooms}
    staff_map = {s.id: s.name for s in staffs}
    
    report = {}
    
    for s in staffs:
        report[s.name] = {"bed": {}, "bath": {}, "towel": 0}

    for r in records:
        room = room_map.get(r.room_id)
        if not room: continue
        
        # Bed Count
        if r.bed_staff_id:
            s_name = staff_map.get(r.bed_staff_id)
            if s_name:
                qty = report[s_name]["bed"].get(room.type, 0)
                report[s_name]["bed"][room.type] = qty + 1
        
        # Bath Count
        if r.bath_staff_id:
            s_name = staff_map.get(r.bath_staff_id)
            if s_name:
                qty = report[s_name]["bath"].get(room.type, 0)
                report[s_name]["bath"][room.type] = qty + 1
        
        # Towel Count - credited to Bed Staff 
        if r.towel_count > 0 and r.bed_staff_id:
            s_name = staff_map.get(r.bed_staff_id)
            if s_name:
                report[s_name]["towel"] += r.towel_count

    return report

def get_vendor_report(db: Session, date: str):
    records = db.query(models.CleaningRecord).filter(models.CleaningRecord.date == date).all()
    rooms = db.query(models.Room).all()
    staffs = db.query(models.Staff).all()
    
    in_house_staff = next((s for s in staffs if s.name == "自社"), None)
    in_house_id = in_house_staff.id if in_house_staff else -1
    
    room_map = {r.id: r for r in rooms}
    staff_name_map = {s.id: s.name for s in staffs}
    
    # Structure:
    # {
    #   "staff_reports": {
    #     "Staff Name": {
    #       "matrix": { floor (str): { type: points, "Total": 0 } },
    #       "details": [ {room, type, work, points} ],
    #       "total_points": 0
    #     }
    #   }
    # }
    staff_reports = {}

    def init_staff_report(s_name):
        if s_name not in staff_reports:
            staff_reports[s_name] = {
                "matrix": { str(f): {"D・D": 0.0, "Total": 0.0} for f in range(7, 13) },
                "details": [],
                "total_points": 0.0
            }
        return staff_reports[s_name]

    for r in records:
        room = room_map.get(r.room_id)
        if not room: continue
        
        is_dd = r.towel_count > 0
        floor_key = str(room.floor)
        room_type = room.type # DB, TW, TRP, SW etc.

        # 1. Handle D.D (Towel) - Typically credited to In-House
        if is_dd:
            # Logic: Points = 1.0 for D.D, only credited to In-House (per Phase 7/9)
            # We credit it to "自社" even if no specific staff is assigned to Bed for this record
            rep = init_staff_report("自社")
            pts = 1.0
            rep["matrix"][floor_key]["D・D"] = rep["matrix"][floor_key].get("D・D", 0.0) + 1.0
            rep["matrix"][floor_key]["Total"] += pts
            rep["total_points"] += pts
            rep["details"].append({"room": room.number, "type": room.type, "work": "D・D", "points": pts})
            # Also handle if a specific staff was assigned to Bed (though for D.D we prioritize Global/In-House credit)
            # If the bed_staff was NOT in-house, we still track the D・D column for them as 1.0 (count) but 0 pts
            if r.bed_staff_id and r.bed_staff_id != in_house_id:
                s_name_v = staff_name_map.get(r.bed_staff_id)
                if s_name_v:
                    rep_v = init_staff_report(s_name_v)
                    rep_v["matrix"][floor_key]["D・D"] = rep_v["matrix"][floor_key].get("D・D", 0.0) + 1.0
            continue

        # 2. Handle Bed Cleaning
        if r.bed_staff_id:
            s_name = staff_name_map.get(r.bed_staff_id)
            if s_name:
                pts = 0.5
                rep = init_staff_report(s_name)
                rep["matrix"][floor_key][room_type] = rep["matrix"][floor_key].get(room_type, 0.0) + pts
                rep["matrix"][floor_key]["Total"] += pts
                rep["total_points"] += pts
                # Look for existing detail for this room to combine into "Full" if possible
                existing = next((d for d in rep["details"] if d["room"] == room.number), None)
                if existing:
                    existing["work"] = "Full"
                    existing["points"] += pts
                else:
                    rep["details"].append({"room": room.number, "type": room.type, "work": "Bed only", "points": pts})

        # 3. Handle Bath Cleaning
        if r.bath_staff_id:
            s_name = staff_name_map.get(r.bath_staff_id)
            if s_name:
                pts = 0.5
                rep = init_staff_report(s_name)
                rep["matrix"][floor_key][room_type] = rep["matrix"][floor_key].get(room_type, 0.0) + pts
                rep["matrix"][floor_key]["Total"] += pts
                rep["total_points"] += pts
                existing = next((d for d in rep["details"] if d["room"] == room.number), None)
                if existing:
                    existing["work"] = "Full"
                    existing["points"] += pts
                else:
                    rep["details"].append({"room": room.number, "type": room.type, "work": "Bath only", "points": pts})

    # 4. Aggregate Matrices
    vendor_total = { str(f): {"DB": 0.0, "TW": 0.0, "TRP": 0.0, "SW": 0.0, "D・D": 0.0, "Total": 0.0} for f in range(7, 13) }
    in_house_total = { str(f): {"DB": 0.0, "TW": 0.0, "TRP": 0.0, "SW": 0.0, "D・D": 0.0, "Total": 0.0} for f in range(7, 13) }
    hotel_total = { str(f): {"DB": 0.0, "TW": 0.0, "TRP": 0.0, "SW": 0.0, "D・D": 0.0, "Total": 0.0} for f in range(7, 13) }
    
    v_pts = 0.0
    i_pts = 0.0
    h_pts = 0.0

    for s_name, rep in staff_reports.items():
        is_vendor = (s_name != "自社")
        matrix = rep["matrix"]
        
        for f, stats in matrix.items():
            for t, val in stats.items():
                if t == "Total": continue
                
                # Global Hotel Total
                hotel_total[f][t] = hotel_total[f].get(t, 0.0) + val
                hotel_total[f]["Total"] += val
                
                if is_vendor:
                    # Vendor Total (Excludes D.D points because pts=0 for D.D in vendor staff)
                    vendor_total[f][t] = vendor_total[f].get(t, 0.0) + val
                    vendor_total[f]["Total"] += val
                else:
                    # In-House Total (Includes D.D points because pts=1.0 for D.D in in-house staff)
                    in_house_total[f][t] = in_house_total[f].get(t, 0.0) + val
                    in_house_total[f]["Total"] += val
        
        h_pts += rep["total_points"]
        if is_vendor:
            v_pts += rep["total_points"]
        else:
            i_pts += rep["total_points"]

    return {
        "staff_reports": staff_reports,
        "vendor_total": {"matrix": vendor_total, "total_points": v_pts},
        "in_house_total": {"matrix": in_house_total, "total_points": i_pts},
        "hotel_total": {"matrix": hotel_total, "total_points": h_pts}
    }

def get_monthly_report(db: Session, year_month: str):
    # year_month format: "YYYY-MM"
    records = db.query(models.CleaningRecord).filter(models.CleaningRecord.date.like(f"{year_month}%")).all()
    rooms = db.query(models.Room).all()
    staffs = db.query(models.Staff).all()
    
    room_map = {r.id: r for r in rooms}
    staff_map = {s.id: s for s in staffs}
    
    in_house_staff = next((s for s in staffs if s.name == "自社"), None)
    in_house_id = in_house_staff.id if in_house_staff else -1

    # Structure: { day_str: { type: sum } }
    vendor_monthly = {} # Only DB/TW/TRP/SW, external staff
    hotel_monthly = {}  # DB/TW/TRP/SW/D・D, all staff

    # Initialize all days in month if we want a complete list (optional, but 1-31 is better)
    # We'll just populate as we find data for now, frontend can handle the 1-31 display.

    for rec in records:
        day = rec.date.split("-")[-1] # "DD"
        room = room_map.get(rec.room_id)
        if not room: continue
        
        r_type = room.type # DB, TW, TRP, SW
        is_dd = rec.towel_count > 0
        
        # Initialize day dicts
        if day not in vendor_monthly: vendor_monthly[day] = {"DB": 0.0, "TW": 0.0, "TRP": 0.0, "SW": 0.0, "Total": 0.0}
        if day not in hotel_monthly: hotel_monthly[day] = {"DB": 0.0, "TW": 0.0, "TRP": 0.0, "SW": 0.0, "D・D": 0.0, "Total": 0.0}
        
        # 1. Handle D.D (Towel Response)
        if is_dd:
            # Hotel Monthly gets 1.0 point for D.D
            hotel_monthly[day]["D・D"] += 1.0
            hotel_monthly[day]["Total"] += 1.0
            # Vendor Monthly EXCLUDES D.D points per user requirement
            continue

        # 2. Handle Bed Cleaning
        if rec.bed_staff_id:
            pts = 0.5
            is_v = (rec.bed_staff_id != in_house_id)
            # Update Hotel
            if r_type in hotel_monthly[day]:
                hotel_monthly[day][r_type] += pts
                hotel_monthly[day]["Total"] += pts
            # Update Vendor
            if is_v and r_type in vendor_monthly[day]:
                vendor_monthly[day][r_type] += pts
                vendor_monthly[day]["Total"] += pts

        # 3. Handle Bath Cleaning
        if rec.bath_staff_id:
            pts = 0.5
            is_v = (rec.bath_staff_id != in_house_id)
            # Update Hotel
            if r_type in hotel_monthly[day]:
                hotel_monthly[day][r_type] += pts
                hotel_monthly[day]["Total"] += pts
            # Update Vendor
            if is_v and r_type in vendor_monthly[day]:
                vendor_monthly[day][r_type] += pts
                vendor_monthly[day]["Total"] += pts

    return {
        "vendor_monthly": vendor_monthly,
        "hotel_monthly": hotel_monthly
    }

def lock_month(db: Session, year_month: str, is_locked: int):
    db_lock = db.query(models.MonthlyLock).filter(models.MonthlyLock.year_month == year_month).first()
    if db_lock:
        db_lock.is_locked = is_locked
    else:
        db_lock = models.MonthlyLock(year_month=year_month, is_locked=is_locked)
        db.add(db_lock)
    db.commit()
    return db_lock

def is_month_locked(db: Session, year_month: str):
    db_lock = db.query(models.MonthlyLock).filter(models.MonthlyLock.year_month == year_month).first()
    if db_lock:
        return db_lock.is_locked == 1
    return False

def get_daily_lock(db: Session, date: str):
    db_lock = db.query(models.DailyLock).filter(models.DailyLock.date == date).first()
    if db_lock:
        return db_lock
    # Return a default unlocked state
    return models.DailyLock(date=date, is_locked=0)

def lock_day(db: Session, date: str, is_locked: int):
    # 1. Update DailyLock table
    db_lock = db.query(models.DailyLock).filter(models.DailyLock.date == date).first()
    if db_lock:
        db_lock.is_locked = is_locked
    else:
        db_lock = models.DailyLock(date=date, is_locked=is_locked)
        db.add(db_lock)
    
    # 2. Sync status to all CleaningRecords for this date
    status_val = "locked" if is_locked == 1 else "draft"
    db.query(models.CleaningRecord).filter(models.CleaningRecord.date == date).update({"status": status_val})
    
    db.commit()
    db.refresh(db_lock)
    return db_lock

def is_day_locked(db: Session, date: str):
    db_lock = db.query(models.DailyLock).filter(models.DailyLock.date == date).first()
    if db_lock:
        return db_lock.is_locked == 1
    return False

def get_all_data(db: Session):
    def clean_obj(obj):
        d = obj.__dict__.copy()
        d.pop('_sa_instance_state', None)
        return d

    return {
        "staff": [clean_obj(s) for s in db.query(models.Staff).all()],
        "rooms": [clean_obj(r) for r in db.query(models.Room).all()],
        "records": [clean_obj(r) for r in db.query(models.CleaningRecord).all()]
    }

def restore_all_data(db: Session, data: dict):
    # Remove SQLAlchemy internal state before re-inserting
    def clean(obj_list):
        for o in obj_list:
            o.pop('_sa_instance_state', None)
        return obj_list

    # Delete existing
    db.query(models.CleaningRecord).delete()
    db.query(models.Staff).delete()
    db.query(models.Room).delete()
    db.commit()

    # Re-insert Staff
    for s in clean(data.get("staff", [])):
        db.add(models.Staff(**s))
    # Re-insert Rooms
    for r in clean(data.get("rooms", [])):
        db.add(models.Room(**r))
    db.commit()

    # Re-insert Records
    for rec in clean(data.get("records", [])):
        db.add(models.CleaningRecord(**rec))
    db.commit()
    return True

