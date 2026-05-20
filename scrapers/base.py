from typing import List, Dict, Optional
from pydantic import BaseModel
import datetime

class ScrapedSignal(BaseModel):
    company_name: str
    state: Optional[str] = None
    city: Optional[str] = None
    signal_type: str # 'hiring', 'news', 'social'
    source: str      # 'Indeed', 'DuckDuckGo News', 'LinkedIn'
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    created_at: datetime.datetime = datetime.datetime.utcnow()

class BaseScraper:
    def scrape(self, states: List[str] = None) -> List[ScrapedSignal]:
        """
        Base method to be implemented by all scrapers.
        """
        raise NotImplementedError("Scrapers must implement the scrape() method")
