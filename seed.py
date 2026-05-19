import random
from database import engine, Base, SessionLocal, FirmLead
from models import Lead

# List of all 50 US state codes
ALL_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

def generate_mock_leads_for_state(state: str, count: int) -> list:
    firm_types = ["Civil", "Structural", "MEP", "Geotechnical", "Environmental", "Electrical", "Mechanical", "Transportation"]
    
    # State-specific major cities mapping
    cities_map = {
        "TX": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
        "CA": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
        "NY": ["New York", "Buffalo", "Rochester", "Albany", "Syracuse"],
        "FL": ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"],
        "IL": ["Chicago", "Aurora", "Naperville", "Springfield", "Peoria"],
        "WA": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
        "PA": ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading"],
        "OH": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"],
        "GA": ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah"],
        "NC": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"],
        "MI": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor"],
        "NJ": ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison"],
        "VA": ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News"],
    }
    
    leads = []
    random.seed(state + "_seed_2") 
    
    state_cities = cities_map.get(state, [f"{state} City", f"North {state}", f"West {state}", f"South {state}", f"East {state}"])
    first_words = ["Apex", "Summit", "Pinnacle", "Quantum", "Nexus", "Vertex", "Meridian", "Zenith", "Prime", "Alpha", "Omega", "Atlas", "Titan", "Vanguard", "Horizon", "Pioneer", "Frontier", "Sterling", "Noble", "Crown", "Royal", "Imperial", "Majestic", "Grand", "Supreme", "Paramount", "Chief", "Master", "Elite", "Premier", "Select", "Choice", "First", "Top", "Peak", "Crest", "Crown", "Star", "Sun", "Moon", "Sky", "Cloud", "Earth", "Wind", "Fire", "Water", "Ice", "Snow", "Rain", "Storm"]
    last_words = ["Build", "Construct", "Design", "Plan", "Draft", "Map", "Chart", "Survey", "Measure", "Assess", "Evaluate", "Analyze", "Test", "Inspect", "Review", "Audit", "Certify", "Verify", "Validate", "Approve", "Permit", "License", "Register", "Record", "Report", "Document", "File", "Store", "Archive", "Save", "Keep", "Hold", "Retain", "Maintain", "Preserve", "Protect", "Defend", "Guard", "Shield", "Secure", "Safe", "Lock", "Key", "Gate", "Door", "Window", "Wall", "Roof", "Floor", "Ceiling"]

    
    for i in range(1, count + 1):
        base_name = f"{random.choice(first_words)} {random.choice(last_words)}"

        
        suffix = random.choice(['Engineering', 'Associates', 'Consulting', 'Design', 'Group', 'Partners', 'Solutions', 'LLC'])
        name = f"{base_name} {suffix}"
        
        firm_type = random.choice(firm_types)
        city = random.choice(state_cities)
        has_email = random.choice([True, True, False]) # 66% chance of having email
        has_linkedin = random.choice([True, True, False])
        
        # Make a realistic domain name
        domain = "".join([c for c in base_name.split()[0].lower() if c.isalnum()])
        
        leads.append({
            "id": f"{state}-{i}",
            "name": name,
            "firm_type": firm_type,
            "state": state,
            "city": city,
            "address": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Washington', 'Lake', 'Hill'])} St",
            "phone": f"{random.randint(200, 999)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}",
            "email": f"contact@{domain}eng.com" if has_email else "",
            "website": f"{domain}eng.com",
            "linkedin": f"linkedin.com/company/{domain}-engineering" if has_linkedin else "",
            "reg_date": f"{random.randint(1990, 2023)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
            "license_no": f"{state}-{firm_type[:2].upper()}-{random.randint(10000,99999)}",
            "status": "Active",
            "source": f"{state} State Board"
        })
    return leads


def main():
    print("Creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    total_inserted = 0
    
    print("Seeding database with engineering firms...")
    try:
        for state in ALL_STATES:
            # Generate 2,500 - 8,000 leads per state to match real-world scale
            random.seed(state + "_count_massive")
            count = random.randint(2500, 8000)
            
            raw_leads = generate_mock_leads_for_state(state, count)
            
            db_leads = [FirmLead(**lead_data) for lead_data in raw_leads]
            db.bulk_save_objects(db_leads)
            db.commit()
            total_inserted += len(raw_leads)
            print(f"[{state}] Inserted {len(raw_leads)} firms.")
            
        print(f"\nSuccessfully seeded {total_inserted} firms into the database!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
