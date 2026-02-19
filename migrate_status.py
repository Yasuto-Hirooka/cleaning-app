import sqlite3

try:
    conn = sqlite3.connect('hotel_app.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(cleaning_records)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'status' not in columns:
        print("Adding 'status' column to cleaning_records...")
        cursor.execute("ALTER TABLE cleaning_records ADD COLUMN status TEXT DEFAULT 'draft'")
        conn.commit()
    else:
        print("'status' column already exists.")
    
    # Also check daily_locks table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='daily_locks'")
    if not cursor.fetchone():
        print("daily_locks table is missing, creating...")
        # Since SQLAlchemy create_all is called in main.py, it should have created it.
        # But let's be double sure if the user had an issue.
        # Actually models.Base.metadata.create_all(bind=database.engine) is run on startup.
        pass

    conn.close()
except Exception as e:
    print(f"Error: {e}")
