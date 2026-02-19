from sqlalchemy.orm import Session
import models, database

def clear_records():
    db = database.SessionLocal()
    try:
        print("Clearing all cleaning records...")
        num_deleted = db.query(models.CleaningRecord).delete()
        db.commit()
        print(f"Deleted {num_deleted} records.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_records()
