# Veltrix Backend

On-demand US engineering firm scraper. FastAPI + in-memory 24hr cache.

## Local setup
```bash
cd veltrix-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your keys
uvicorn main:app --reload
# API at http://localhost:8000
```

## .env
```
GOOGLE_MAPS_KEY=your_key_here
HUNTER_KEY=your_key_here
```

## Key endpoints
| Endpoint | Description |
|---|---|
| `GET /api/leads?state=TX` | Scrape + return leads |
| `GET /api/leads?state=TX&firm_type=Civil&keyword=houston` | Filtered |
| `GET /api/cache/status` | See what's cached |
| `DELETE /api/cache/TX` | Force re-scrape |
| `GET /api/states` | List supported states |

## Free deploy on Render
1. Push this folder to GitHub
2. Go to render.com → New Web Service → connect repo
3. Render detects `render.yaml` automatically
4. Add `GOOGLE_MAPS_KEY` and `HUNTER_KEY` in Environment tab
5. Deploy — get a free `*.onrender.com` URL
6. Paste that URL into the React frontend as `VITE_API_URL`

## Data sources
| State | Source | Method |
|---|---|---|
| TX | TBPELS daily ZIP/CSV | Direct download |
| CA | DCA license search API | JSON API |
| NY | data.ny.gov Socrata | Open Data API |
| FL | FBPE directory | File download |
| IL | IDFPR license search | JSON API + HTML fallback |

## Enrichment (optional, free tiers)
- **Google Maps** — phone, website, address ($200 free/mo ≈ 40k lookups)
- **Hunter.io** — email from domain (25 free/mo, upgrade for more)
- Set neither key = boards data only, no enrichment

## Adding more states
Add a `scrape_xx()` async function in `scraper.py` and register it in the `scrapers` dict.
