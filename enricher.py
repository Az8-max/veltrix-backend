"""
enricher.py — Google Maps + Hunter.io enrichment (async, batched)
Set GOOGLE_MAPS_KEY and HUNTER_KEY in environment variables.
Free tiers: Google Maps $200/mo credit, Hunter.io 25 searches/mo.
"""
import asyncio, os, httpx, logging, re
from typing import List
from models import Lead

logger = logging.getLogger(__name__)
GMAPS_KEY = os.getenv("GOOGLE_MAPS_KEY", "")
HUNTER_KEY = os.getenv("HUNTER_KEY", "")

async def enrich_leads(leads: List[Lead]) -> List[Lead]:
    """Enrich in batches of 10 to avoid rate limits."""
    if not GMAPS_KEY:
        logger.warning("No GOOGLE_MAPS_KEY — skipping enrichment")
        return leads
    tasks = [enrich_one(l) for l in leads]
    # Run 10 at a time
    results = []
    for i in range(0, len(tasks), 10):
        batch = await asyncio.gather(*tasks[i:i+10], return_exceptions=True)
        for r, orig in zip(batch, leads[i:i+10]):
            results.append(r if isinstance(r, Lead) else orig)
        await asyncio.sleep(0.2)
    return results

async def enrich_one(lead: Lead) -> Lead:
    async with httpx.AsyncClient(timeout=10) as client:
        lead = await _gmaps(client, lead)
        if lead.website and HUNTER_KEY:
            lead = await _hunter(client, lead)
    return lead

async def _gmaps(client, lead: Lead) -> Lead:
    try:
        query = f"{lead.name} engineering {lead.city or ''} {lead.state}"
        r = await client.get(
            "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
            params={"input": query, "inputtype": "textquery",
                    "fields": "name,formatted_address,formatted_phone_number,website",
                    "key": GMAPS_KEY}
        )
        data = r.json()
        cand = data.get("candidates", [{}])[0]
        if cand:
            if not lead.phone and cand.get("formatted_phone_number"):
                lead.phone = cand["formatted_phone_number"]
            if not lead.website and cand.get("website"):
                lead.website = cand["website"].replace("https://","").replace("http://","").rstrip("/")
            if not lead.address and cand.get("formatted_address"):
                lead.address = cand["formatted_address"]
    except Exception as e:
        logger.debug(f"GMaps failed for {lead.name}: {e}")
    return lead

async def _hunter(client, lead: Lead) -> Lead:
    try:
        domain = lead.website.split("/")[0] if lead.website else ""
        if not domain: return lead
        r = await client.get(
            "https://api.hunter.io/v2/domain-search",
            params={"domain": domain, "api_key": HUNTER_KEY, "limit": 1}
        )
        data = r.json().get("data", {})
        emails = data.get("emails", [])
        if emails and not lead.email:
            lead.email = emails[0].get("value")
    except Exception as e:
        logger.debug(f"Hunter failed for {lead.name}: {e}")
    return lead
