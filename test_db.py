import sqlite3
import traceback

try:
    conn = sqlite3.connect('leads.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(users)")
    print("USERS schema:", cursor.fetchall())
    
    cursor.execute("SELECT id, name, team_id, last_active FROM users")
    print("USERS data:", cursor.fetchall())
    
    cursor.execute("SELECT id, name FROM teams")
    print("TEAMS data:", cursor.fetchall())
except Exception as e:
    traceback.print_exc()
finally:
    conn.close()
