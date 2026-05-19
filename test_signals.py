from database import SessionLocal, FirmLead, Base, engine, IntentSignal
from signals import fetch_and_cache_signals
import uuid

# Recreate tables locally just in case
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Create a mock lead for testing
test_lead_id = str(uuid.uuid4())
mock_lead = FirmLead(
    id=test_lead_id,
    name="Apex Engineering",
    firm_type="Structural",
    state="TX",
    city="Houston",
    address="123 Main St",
    license_no="TX-ST-99999",
    reg_date="2020-01-01",
    status="Active",
    source="Test Board"
)
db.add(mock_lead)
db.commit()

print("Mock lead created. Fetching signals...")
signals = fetch_and_cache_signals(test_lead_id, db)

print(f"\nFetched {len(signals)} signals!")
for s in signals:
    print(f"- [{s.signal_type.upper()}] {s.source}: {s.title} (URL: {s.url[:50]}...)")

# Query lead to check updated score
updated_lead = db.query(FirmLead).filter(FirmLead.id == test_lead_id).first()
print(f"\nCalculated Intent Score: {updated_lead.intent_score} / 100")

# Clean up
db.delete(updated_lead)
db.query(IntentSignal).filter(IntentSignal.lead_id == test_lead_id).delete()
db.commit()
db.close()
