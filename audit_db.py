import sqlite3
import os

db_path = 'backend/hotel_app.db'
if not os.path.exists(db_path):
    print(f"Error: DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("--- Data Integrity Audit ---")
try:
    cursor.execute("SELECT date, COUNT(*) as count FROM cleaning_records GROUP BY date")
    rows = cursor.fetchall()
    if not rows:
        print("No records found in cleaning_records.")
    else:
        for row in rows:
            print(f"Date: {row['date']}, Records: {row['count']}")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")

conn.close()
