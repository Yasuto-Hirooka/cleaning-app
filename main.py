from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import io
import pandas as pd

import models, schemas, crud, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:8000",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initial Data Seeding
@app.on_event("startup")
def startup_populate():
    db = database.SessionLocal()
    try:
        crud.seed_data(db)
    finally:
        db.close()

# Staff Endpoints
@app.get("/api/staff", response_model=List[schemas.Staff])
def read_staff(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_staff(db, skip, limit)

@app.post("/api/staff", response_model=schemas.Staff)
def create_staff(staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    return crud.create_staff(db, staff)

@app.delete("/api/staff/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    if crud.delete_staff(db, staff_id):
        return {"message": "Staff deleted"}
    raise HTTPException(status_code=404, detail="Staff not found")

# Room Endpoints
@app.get("/api/rooms", response_model=List[schemas.Room])
def read_rooms(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return crud.get_rooms(db, skip, limit)

@app.post("/api/rooms", response_model=schemas.Room)
def create_room(room: schemas.RoomCreate, db: Session = Depends(get_db)):
    return crud.create_room(db, room)

@app.delete("/api/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    if crud.delete_room(db, room_id):
        return {"message": "Room deleted"}
    raise HTTPException(status_code=404, detail="Room not found")

# Records & Reports
@app.post("/api/records")
def create_records(records: List[schemas.CleaningRecordCreate], date: str = None, db: Session = Depends(get_db)):
    return crud.create_cleaning_records(db, records, target_date=date)

@app.get("/api/records/raw")
def get_raw_records(date: str, db: Session = Depends(get_db)):
    records = crud.get_raw_records(db, date)
    return {"records": records}

@app.get("/api/reports/daily")
def get_daily_report(date: str, db: Session = Depends(get_db)):
    return crud.get_daily_report(db, date)

@app.get("/api/reports/vendor")
def get_vendor_report(date: str, db: Session = Depends(get_db)):
    return crud.get_vendor_report(db, date)

@app.get("/api/reports/vendor/export")
def export_vendor_report(date: str, db: Session = Depends(get_db)):
    data = crud.get_vendor_report(db, date)
    reports = data.get("staff_reports", {})
    if not reports:
        raise HTTPException(status_code=404, detail="No data for this date")
    
    types = ["DB", "TW", "TRP", "SW", "D・D"]
    floors = [str(f) for f in range(7, 13)]

    def append_matrix_to_rows(target_rows, title, matrix, total_pts):
        target_rows.append({"Floor": f"--- {title} ---"})
        staff_rows = []
        for f in floors:
            row = {"Floor": f"{f}F"}
            for t in types:
                row[t] = matrix.get(f, {}).get(t, 0.0)
            row["Total"] = matrix.get(f, {}).get("Total", 0.0)
            staff_rows.append(row)
        
        df_temp = pd.DataFrame(staff_rows)
        totals_row = {"Floor": "合計"}
        for t in types:
            totals_row[t] = df_temp[t].sum()
        totals_row["Total"] = df_temp["Total"].sum()
        
        target_rows.extend(staff_rows)
        target_rows.append(totals_row)
        target_rows.append({"Floor": ""}) # Spacer

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # 1. Summary Sheet (Sequence 1-4)
        all_summary_data = []
        
        # Section 1: Individual Staff
        for s_name, rep in reports.items():
            append_matrix_to_rows(all_summary_data, f"作業者日報: {s_name}", rep["matrix"], rep["total_points"])
        
        # Section 2: Vendor Total
        append_matrix_to_rows(all_summary_data, "ワールドクリーン（外注）", data["vendor_total"]["matrix"], data["vendor_total"]["total_points"])
        
        # Section 3: In-House Total
        append_matrix_to_rows(all_summary_data, "ベストクリエイト（自社）", data["in_house_total"]["matrix"], data["in_house_total"]["total_points"])
        
        # Section 4: Hotel Total
        append_matrix_to_rows(all_summary_data, "ポートタワーホテル（全体）", data["hotel_total"]["matrix"], data["hotel_total"]["total_points"])

        df_all_summary = pd.DataFrame(all_summary_data)
        cols = ["Floor"] + types + ["Total"]
        df_all_summary = df_all_summary[cols].rename(columns={"Floor": "フロア", "Total": "合計"})
        df_all_summary.to_excel(writer, index=False, sheet_name='集計表')

        # 2. Details Sheet
        detail_rows = []
        for staff_name, rep in reports.items():
            for d in rep["details"]:
                detail_rows.append({
                    "作業者": staff_name,
                    "部屋番号": d["room"],
                    "タイプ": d["type"],
                    "作業内容": d["work"],
                    "ポイント": d["points"]
                })
        
        if detail_rows:
            df_detail = pd.DataFrame(detail_rows)
            df_detail.to_excel(writer, index=False, sheet_name='詳細')

    output.seek(0)
    filename = f"vendor_report_{date}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/reports/monthly")
def get_monthly_report(year_month: str, db: Session = Depends(get_db)):
    # year_month format: "YYYY-MM"
    return crud.get_monthly_report(db, year_month)

@app.get("/api/reports/monthly/export")
def export_monthly_report(year_month: str, db: Session = Depends(get_db)):
    data = crud.get_monthly_report(db, year_month)
    vendor_data = data["vendor_monthly"]
    hotel_data = data["hotel_monthly"]

    if not vendor_data and not hotel_data:
        raise HTTPException(status_code=404, detail="No data for this month")

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Helper to prepare monthly rows
        def prepare_rows(monthly_dict, types):
            rows = []
            sorted_days = sorted(monthly_dict.keys())
            for day in sorted_days:
                stats = monthly_dict[day]
                row = {"日付": day}
                for t in types:
                    row[t] = stats.get(t, 0.0)
                row["合計"] = stats.get("Total", 0.0)
                rows.append(row)
            
            if rows:
                df_temp = pd.DataFrame(rows)
                totals_row = {"日付": "月間合計"}
                for t in types:
                    totals_row[t] = df_temp[t].sum()
                totals_row["合計"] = df_temp["合計"].sum()
                rows.append(totals_row)
            return rows

        # 1. Vendor Monthly
        v_types = ["DB", "TW", "TRP", "SW"]
        v_rows = prepare_rows(vendor_data, v_types)
        df_v = pd.DataFrame(v_rows)
        df_v.to_excel(writer, index=False, sheet_name='ワールドクリーン月報')

        # 2. Hotel Monthly
        h_types = ["DB", "TW", "TRP", "SW", "D・D"]
        h_rows = prepare_rows(hotel_data, h_types)
        df_h = pd.DataFrame(h_rows)
        df_h.to_excel(writer, index=False, sheet_name='ホテル全体月報')

    output.seek(0)
    filename = f"monthly_report_{year_month}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Data Management (Backup/Restore)
@app.get("/api/admin/export")
def export_database_json(db: Session = Depends(get_db)):
    return crud.get_all_data(db)

@app.post("/api/admin/import")
def import_database_json(data: dict, db: Session = Depends(get_db)):
    try:
        crud.restore_all_data(db, data)
        return {"message": "Database restored successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Monthly Locking
@app.get("/api/locks/{year_month}")
def get_lock_status(year_month: str, db: Session = Depends(get_db)):
    return {"year_month": year_month, "is_locked": crud.is_month_locked(db, year_month)}

@app.post("/api/locks")
def set_lock_status(lock_data: schemas.MonthlyLockBase, db: Session = Depends(get_db)):
    return crud.lock_month(db, lock_data.year_month, lock_data.is_locked)

# Daily Locking
@app.get("/api/daily-locks/{date}")
def get_daily_lock_status(date: str, db: Session = Depends(get_db)):
    lock = crud.get_daily_lock(db, date)
    return {"date": date, "is_locked": lock.is_locked == 1}

@app.post("/api/daily-locks/{date}")
def set_daily_lock_status(date: str, lock_data: schemas.DailyLockUpdate, db: Session = Depends(get_db)):
    # Cannot unlock if month is locked
    year_month = date[:7]
    if lock_data.is_locked == 0 and crud.is_month_locked(db, year_month):
        raise HTTPException(status_code=403, detail=f"Cannot unlock: Month {year_month} is locked.")
    return crud.lock_day(db, date, lock_data.is_locked)
