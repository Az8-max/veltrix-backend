from typing import Optional, Tuple
from thefuzz import process, fuzz
from sqlalchemy.orm import Session
from database import FirmLead
from scrapers.base import ScrapedSignal

def match_signal_to_lead(signal: ScrapedSignal, db: Session, min_score: int = 70) -> Tuple[Optional[str], int]:
    """
    Attempts to match a scraped signal to an existing FirmLead in the database.
    Returns a tuple of (lead_id, confidence_score).
    If no match is found above the min_score, returns (None, 0).
    """
    
    # 1. Filter candidates by state if state is provided
    query = db.query(FirmLead.id, FirmLead.name)
    if signal.state:
        # In a real app, you might want to map "Texas" to "TX" depending on how it's stored.
        # Our db stores state codes (e.g., 'TX', 'CA').
        state_map = {
            "Texas": "TX", "California": "CA", "New York": "NY", "Florida": "FL",
            "Illinois": "IL", "Washington": "WA", "Pennsylvania": "PA", "Ohio": "OH"
        }
        state_code = state_map.get(signal.state, signal.state)
        query = query.filter(FirmLead.state == state_code)
        
    candidates = query.all()
    
    if not candidates:
        return None, 0
        
    # Create a dictionary mapping firm name to its ID
    # Note: If multiple firms have the EXACT same name in a state, this will overwrite,
    # but it's fine for this naive matching engine.
    candidate_dict = {c.name: c.id for c in candidates}
    candidate_names = list(candidate_dict.keys())
    
    # 2. Fuzzy match the scraped company name against the candidates
    # extractOne returns a tuple: (best_match_string, score)
    best_match = process.extractOne(
        query=signal.company_name,
        choices=candidate_names,
        scorer=fuzz.token_set_ratio # token_set_ratio handles partial matches well
    )
    
    if best_match:
        matched_name, score = best_match
        if score >= min_score:
            lead_id = candidate_dict[matched_name]
            return lead_id, score
            
    return None, 0
