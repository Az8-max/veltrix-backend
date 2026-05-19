import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import datetime
import uuid
import re
from sqlalchemy.orm import Session
from database import IntentSignal, FirmLead


def parse_rss_feed(query: str) -> list:
    """Fetch and parse Google News RSS feed for a specific query."""
    encoded_query = urllib.parse.quote_plus(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)

            items = []
            seen_urls = set()
            for item in root.findall(".//item"):
                title_el = item.find("title")
                link_el = item.find("link")
                pub_date_el = item.find("pubDate")
                source_el = item.find("source")

                title = title_el.text.strip() if title_el is not None and title_el.text else ""
                link = link_el.text.strip() if link_el is not None and link_el.text else ""
                pub_date_str = pub_date_el.text.strip() if pub_date_el is not None and pub_date_el.text else ""
                source = source_el.text.strip() if source_el is not None and source_el.text else "Google News"

                if not title or not link:
                    continue

                # Deduplicate by URL
                if link in seen_urls:
                    continue
                seen_urls.add(link)

                # Parse pubDate  Format: "Tue, 19 May 2026 07:21:27 GMT"
                try:
                    pub_date = datetime.datetime.strptime(pub_date_str, "%a, %d %b %Y %H:%M:%S %Z")
                except Exception:
                    pub_date = datetime.datetime.utcnow()

                items.append({
                    "title": title,
                    "url": link,
                    "source": source,
                    "created_at": pub_date,
                })
            return items
    except Exception as e:
        print(f"RSS fetch error for '{query}': {e}")
        return []


def is_relevant(title: str, company_name: str) -> bool:
    """
    Returns True only if the company name (or a key part of it) appears in the title.
    Strips common suffixes like LLC, Inc, Engineering, etc. before matching.
    """
    # Strip common generic suffixes to get the core identity
    stopwords = {"llc", "inc", "corp", "engineering", "associates", "consulting",
                 "design", "group", "partners", "solutions", "company", "co", "ltd"}
    
    # Build a set of meaningful tokens from the company name
    tokens = [t.lower() for t in re.split(r"\s+", company_name) if t.lower() not in stopwords and len(t) > 2]
    
    title_lower = title.lower()
    
    # At least one meaningful token must appear in the title
    return any(tok in title_lower for tok in tokens)


def get_hiring_source(url: str, default_source: str) -> str:
    """Identify the job portal from the URL."""
    if "indeed.com" in url:
        return "Indeed"
    elif "linkedin.com" in url:
        return "LinkedIn"
    elif "ziprecruiter.com" in url:
        return "ZipRecruiter"
    elif "simplyhired.com" in url:
        return "SimplyHired"
    elif "glassdoor.com" in url:
        return "Glassdoor"
    return default_source


def fetch_and_cache_signals(lead_id: str, db: Session) -> list:
    """
    Fetch signals from Google News RSS (News, Reddit, Jobs) and cache them in DB.
    Applies relevance filtering (company name must appear in headline)
    and URL deduplication before saving.
    """
    lead = db.query(FirmLead).filter(FirmLead.id == lead_id).first()
    if not lead:
        return []

    company_name = lead.name

    # 1. News: generic company coverage
    news_items = parse_rss_feed(f'"{company_name}" engineering')
    # 2. Social: Reddit discussions
    reddit_items = parse_rss_feed(f'site:reddit.com "{company_name}"')
    # 3. Jobs: major job boards
    job_items = parse_rss_feed(
        f'site:indeed.com OR site:linkedin.com/jobs OR site:ziprecruiter.com OR site:simplyhired.com "{company_name}"'
    )

    signals_to_add = []
    seen_urls_global = set()  # Global dedup across all signal types

    # ── News (top 5, relevance-filtered) ───────────────────────────────────────
    for item in news_items:
        if len([s for s in signals_to_add if s.signal_type == "news"]) >= 5:
            break
        if item["url"] in seen_urls_global:
            continue
        if not is_relevant(item["title"], company_name):
            continue
        seen_urls_global.add(item["url"])
        signals_to_add.append(IntentSignal(
            id=str(uuid.uuid4()),
            lead_id=lead_id,
            signal_type="news",
            source=item["source"],
            title=item["title"],
            description=f"Recent article mentioning {company_name} from {item['source']}.",
            url=item["url"],
            score=60,
            created_at=item["created_at"],
        ))

    # ── Social / Reddit (top 5, relevance-filtered) ────────────────────────────
    for item in reddit_items:
        if len([s for s in signals_to_add if s.signal_type == "social"]) >= 5:
            break
        if item["url"] in seen_urls_global:
            continue
        if not is_relevant(item["title"], company_name):
            continue
        seen_urls_global.add(item["url"])
        signals_to_add.append(IntentSignal(
            id=str(uuid.uuid4()),
            lead_id=lead_id,
            signal_type="social",
            source="Reddit",
            title=item["title"],
            description=f"Discussion or mention of {company_name} in community forums.",
            url=item["url"],
            score=70,
            created_at=item["created_at"],
        ))

    # ── Hiring / Jobs (top 5, relevance-filtered) ──────────────────────────────
    for item in job_items:
        if len([s for s in signals_to_add if s.signal_type == "hiring"]) >= 5:
            break
        if item["url"] in seen_urls_global:
            continue
        if not is_relevant(item["title"], company_name):
            continue
        seen_urls_global.add(item["url"])
        portal = get_hiring_source(item["url"], item["source"])
        signals_to_add.append(IntentSignal(
            id=str(uuid.uuid4()),
            lead_id=lead_id,
            signal_type="hiring",
            source=portal,
            title=item["title"],
            description=f"Active job opening for {company_name} found on {portal}.",
            url=item["url"],
            score=85,
            created_at=item["created_at"],
        ))

    # Delete old signals and save new ones
    db.query(IntentSignal).filter(IntentSignal.lead_id == lead_id).delete()
    if signals_to_add:
        db.add_all(signals_to_add)

    lead.signals_last_checked = datetime.datetime.utcnow()
    db.commit()

    # Recalculate and persist the intent score
    calculate_and_save_intent_score(lead_id, db)

    return signals_to_add


def calculate_and_save_intent_score(lead_id: str, db: Session):
    """
    Calculates an overall intent score based on signal type, recency, and diversity.
    
    Scoring logic:
    - Hiring signals: weight 45 (strongest buying signal)
    - Social signals: weight 30
    - News signals:   weight 25
    - Each signal decays linearly over 30 days (to 20% minimum)
    - +10 bonus if signals come from multiple different types (confidence boost)
    - Score capped at 100
    """
    lead = db.query(FirmLead).filter(FirmLead.id == lead_id).first()
    if not lead:
        return

    signals = db.query(IntentSignal).filter(IntentSignal.lead_id == lead_id).all()
    if not signals:
        lead.intent_score = 0
        db.commit()
        return

    type_weights = {"hiring": 45, "social": 30, "news": 25}
    score = 0
    types_found = set()

    for s in signals:
        types_found.add(s.signal_type)
        age_days = (datetime.datetime.utcnow() - s.created_at).days
        decay = max(0.2, 1.0 - (age_days / 30.0))
        score += type_weights.get(s.signal_type, 10) * decay

    final_score = min(100, int(score))

    # Multi-source diversity boost
    if len(types_found) > 1:
        final_score = min(100, final_score + 10)

    lead.intent_score = final_score
    db.commit()
