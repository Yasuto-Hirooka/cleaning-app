import sqlite3
import os

db_path = 'hotel_app.db'
if not os.path.exists(db_path):
    print(f"Error: Database file {db_path} not found.")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current columns
        cursor.execute("PRAGMA table_info(cleaning_records)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        if 'status' not in columns:
            print("Adding 'status' column to cleaning_records...")
            cursor.execute("ALTER TABLE cleaning_records ADD COLUMN status TEXT DEFAULT 'draft'")
            conn.commit()
            print("Migration successful: Added 'status' column.")
        else:
            print("Status column already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Migration error: {e}")
