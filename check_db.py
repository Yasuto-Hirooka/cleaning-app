import sqlite3
import os

db_path = 'hotel_app.db'
if not os.path.exists(db_path):
    print(f"Database file {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM rooms")
    count = c.fetchone()[0]
    print(f"Number of rooms: {count}")
    
    c.execute("SELECT COUNT(*) FROM staff")
    staff_count = c.fetchone()[0]
    print(f"Number of staff: {staff_count}")
    
    conn.close()
