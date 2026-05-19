import os
import sys

# Get the URL from the user
db_url = input("Please paste your exact Supabase Connection String (DATABASE_URL) and press Enter:\n> ").strip()

if not db_url.startswith("postgres"):
    print("Error: The URL should start with postgres:// or postgresql://")
    sys.exit(1)

# Set it in the environment so database.py picks it up
os.environ["DATABASE_URL"] = db_url

# Now import the seed module (which will trigger database.py to use the Supabase URL)
try:
    print("\nConnecting to Supabase...")
    import seed
    seed.main()
except Exception as e:
    print(f"\nFailed to seed database: {e}")
