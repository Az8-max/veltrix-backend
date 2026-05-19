import sqlite3

def clear_mock_websites():
    conn = sqlite3.connect('leads.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE leads SET website = '', email = ''")
    conn.commit()
    print(f"Cleared {cursor.rowcount} fake websites and emails.")
    conn.close()

if __name__ == "__main__":
    clear_mock_websites()
