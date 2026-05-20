from typing import List
from duckduckgo_search import DDGS
from .base import BaseScraper, ScrapedSignal
import re

class HiringScraper(BaseScraper):
    def scrape(self, states: List[str] = None) -> List[ScrapedSignal]:
        signals = []
        # We will do a targeted search for engineering firms hiring
        # e.g., "engineering firm" "hiring" "civil" OR "structural"
        if not states:
            states = ["Texas", "California", "New York", "Florida"] # Default fallback
            
        with DDGS() as ddgs:
            for state in states:
                query = f'"engineering" "hiring" ("civil" OR "structural") {state}'
                try:
                    results = ddgs.text(query, max_results=10)
                    for r in results:
                        title = r.get("title", "")
                        snippet = r.get("body", "")
                        url = r.get("href", "")
                        
                        # Very naive company name extraction from title
                        # Assuming format like "Civil Engineer at Apex Engineering in TX"
                        # Or "Apex Engineering is hiring..."
                        # We'll extract a chunk of text before "hiring" or after "at"
                        company_name = self._extract_company_name(title, snippet)
                        
                        if company_name:
                            signals.append(ScrapedSignal(
                                company_name=company_name,
                                state=state,
                                signal_type="hiring",
                                source="DuckDuckGo Search",
                                title=title,
                                description=snippet,
                                url=url
                            ))
                except Exception as e:
                    print(f"Error scraping hiring signals for {state}: {e}")
                    
        return signals

    def _extract_company_name(self, title: str, snippet: str) -> str:
        """
        Naive extraction logic. In production, an LLM or SpaCy NER model would be better.
        For now, we'll look for common patterns.
        """
        text = f"{title} {snippet}"
        # Look for "at [Company Name]"
        at_match = re.search(r'\bat\s+([A-Z][a-zA-Z\s&]+(?:Engineering|Group|Associates|LLC|Inc|Corp))', text)
        if at_match:
            return at_match.group(1).strip()
            
        # Look for "[Company Name] is hiring"
        hiring_match = re.search(r'([A-Z][a-zA-Z\s&]+(?:Engineering|Group|Associates|LLC|Inc|Corp))\s+is hiring', text)
        if hiring_match:
            return hiring_match.group(1).strip()
            
        # Fallback: Just return a sanitized title to let the fuzzy matcher try its best
        return title[:50]
