import os
import uuid
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, IntentSignal, FirmLead, Base, engine
from scrapers.hiring import HiringScraper
from scrapers.news import NewsScraper
from matching_engine import match_signal_to_lead

def main():
    print("Initializing Database Session...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    scrapers = [
        HiringScraper(),
        NewsScraper()
    ]
    
    states_to_scrape = ["Texas", "California", "New York", "Florida"]
    
    total_signals_found = 0
    total_matched = 0
    
    try:
        for scraper in scrapers:
            print(f"\n--- Running {scraper.__class__.__name__} ---")
            signals = scraper.scrape(states=states_to_scrape)
            print(f"Found {len(signals)} potential signals.")
            
            for signal in signals:
                total_signals_found += 1
                lead_id, confidence = match_signal_to_lead(signal, db)
                
                if lead_id:
                    print(f"[MATCH] {signal.company_name} matched with score {confidence}")
                    total_matched += 1
                    
                    # Create the IntentSignal record
                    db_signal = IntentSignal(
                        id=str(uuid.uuid4()),
                        lead_id=lead_id,
                        signal_type=signal.signal_type,
                        source=signal.source,
                        title=signal.title,
                        description=signal.description,
                        url=signal.url,
                        score=60 if signal.signal_type == 'hiring' else 40,
                        confidence_score=confidence,
                        raw_company_name=signal.company_name,
                        created_at=datetime.datetime.utcnow()
                    )
                    
                    db.add(db_signal)
                    
                    # Also increase the intent_score on the FirmLead
                    lead = db.query(FirmLead).filter(FirmLead.id == lead_id).first()
                    if lead:
                        lead.intent_score += (60 if signal.signal_type == 'hiring' else 40)
                        
            db.commit()
            
        print(f"\nScraping Complete! Found {total_signals_found} signals, matched {total_matched} to existing leads.")
        
    except Exception as e:
        print(f"Error during scraping pipeline: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
