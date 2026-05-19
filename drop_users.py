import sqlite3
import os

try:
    conn = sqlite3.connect('leads.db')
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS users")
    conn.commit()
    print("Dropped users table successfully.")
except Exception as e:
    print("Error:", e)
finally:
    if 'conn' in locals():
        conn.close()
