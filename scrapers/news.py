from typing import List
from duckduckgo_search import DDGS
from .base import BaseScraper, ScrapedSignal
import re

class NewsScraper(BaseScraper):
    def scrape(self, states: List[str] = None) -> List[ScrapedSignal]:
        signals = []
        if not states:
            states = ["Texas", "California", "New York", "Florida"]
            
        with DDGS() as ddgs:
            for state in states:
                # Use news search instead of standard text search
                query = f'"engineering firm" (awarded OR expanded OR growth) {state}'
                try:
                    # duckduckgo_search news() endpoint returns recent news articles
                    results = ddgs.news(query, max_results=10)
                    for r in results:
                        title = r.get("title", "")
                        snippet = r.get("body", "")
                        url = r.get("url", "")
                        
                        company_name = self._extract_company_name(title, snippet)
                        
                        if company_name:
                            signals.append(ScrapedSignal(
                                company_name=company_name,
                                state=state,
                                signal_type="news",
                                source="DuckDuckGo News",
                                title=title,
                                description=snippet,
                                url=url
                            ))
                except Exception as e:
                    print(f"Error scraping news signals for {state}: {e}")
                    
        return signals

    def _extract_company_name(self, title: str, snippet: str) -> str:
        text = f"{title} {snippet}"
        # Look for "[Company] awarded"
        awarded_match = re.search(r'([A-Z][a-zA-Z\s&]+(?:Engineering|Group|Associates|LLC|Inc|Corp))\s+awarded', text)
        if awarded_match:
            return awarded_match.group(1).strip()
            
        return title[:50]
