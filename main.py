"""
Veltrix Backend — FastAPI
On-demand scraper with 24hr in-memory cache per state.
Deploy free on Render.com (render.yaml included).
"""

from fastapi import FastAPI, Query, HTTPException, Depends, BackgroundTasks
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging
from sqlalchemy.orm import Session
from sqlalchemy import or_

import uuid
import datetime
from sqlalchemy import desc
from auth import verify_password, get_password_hash, create_access_token, get_current_user
from models import UserCreate, UserLogin, Token, UserResponse, TeamCreate, TeamResponse, ActivityCreate, TeamDetailsResponse, TeamMemberStats, DashboardResponse, DashboardStats, FeedItem, LiveMember, SearchResponse, Lead, IntentSignalResponse
from database import User, Team, get_db, FirmLead, LeadActivity, IntentSignal
from signals import fetch_and_cache_signals

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Veltrix API starting up")
    yield
    logger.info("Veltrix API shutting down")

app = FastAPI(
    title="Veltrix API",
    description="On-demand US engineering firm lead discovery",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://frontend-jade-six-67.vercel.app",
        "https://frontend-9ckpz6zog-azaan-fayaz-s-projects.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.requests import Request
from starlette.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions so they return JSON with CORS headers."""
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

@app.get("/")
def root():
    return {"status": "ok", "service": "Veltrix API"}

@app.get("/api/debug/db")
def debug_db(db: Session = Depends(get_db)):
    """Check if the database is working and tables exist."""
    try:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar() if "users" in tables else "table missing"
        lead_count = db.execute(text("SELECT COUNT(*) FROM leads")).scalar() if "leads" in tables else "table missing"
        return {"tables": tables, "users": user_count, "leads": lead_count, "db_url_prefix": str(engine.url)[:30]}
    except Exception as e:
        return {"error": str(e)}

# --- AUTH ROUTES ---

@app.post("/api/auth/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        id=str(uuid.uuid4()),
        name=user.name,
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# --- TEAM ROUTES ---

@app.get("/api/teams", response_model=List[TeamResponse])
def get_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teams = db.query(Team).all()
    # formatting created_at as string
    return [{"id": t.id, "name": t.name, "created_at": t.created_at.isoformat()} for t in teams]

@app.post("/api/teams", response_model=TeamResponse)
def create_team(team: TeamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_team = Team(id=str(uuid.uuid4()), name=team.name)
    db.add(new_team)
    
    current_user.team_id = new_team.id
    db.commit()
    db.refresh(new_team)
    
    return {"id": new_team.id, "name": new_team.name, "created_at": new_team.created_at.isoformat()}

@app.post("/api/teams/join")
def join_team(team_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    current_user.team_id = team.id
    db.commit()
    return {"status": "success", "team_id": team.id}

@app.get("/api/teams/me", response_model=TeamDetailsResponse)
def get_team_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.team_id:
        raise HTTPException(status_code=404, detail="User is not in a team")
    team = db.query(Team).filter(Team.id == current_user.team_id).first()
    
    users = db.query(User).filter(User.team_id == team.id).all()
    members = []
    for u in users:
        viewed = db.query(LeadActivity).filter(LeadActivity.user_id == u.id, LeadActivity.action == "viewed").count()
        exported = db.query(LeadActivity).filter(LeadActivity.user_id == u.id, LeadActivity.action == "exported").count()
        members.append(TeamMemberStats(id=u.id, name=u.name, viewed_count=viewed, exported_count=exported))
        
    return TeamDetailsResponse(id=team.id, name=team.name, created_at=team.created_at.isoformat(), members=members)

# --- DASHBOARD ROUTES ---

def time_ago_str(dt: datetime.datetime):
    diff = datetime.datetime.utcnow() - dt
    if diff.days > 0:
        return f"{diff.days}d ago"
    hours = diff.seconds // 3600
    if hours > 0:
        return f"{hours}h ago"
    mins = diff.seconds // 60
    if mins > 0:
        return f"{mins}m ago"
    return "Just now"

@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - datetime.timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)

    if not current_user.team_id:
        raise HTTPException(status_code=400, detail="Must be in a team to view dashboard")

    # My Stats
    my_activities = db.query(LeadActivity).filter(LeadActivity.user_id == current_user.id).all()
    
    stats = DashboardStats(
        viewed_today=0, exported_today=0,
        viewed_week=0, exported_week=0,
        viewed_month=0, exported_month=0
    )
    
    for a in my_activities:
        if a.timestamp >= today_start:
            if a.action == "viewed": stats.viewed_today += 1
            elif a.action == "exported": stats.exported_today += 1
        if a.timestamp >= week_start:
            if a.action == "viewed": stats.viewed_week += 1
            elif a.action == "exported": stats.exported_week += 1
        if a.timestamp >= month_start:
            if a.action == "viewed": stats.viewed_month += 1
            elif a.action == "exported": stats.exported_month += 1

    # Live Members
    fifteen_mins_ago = now - datetime.timedelta(minutes=15)
    live_users_query = db.query(User).filter(
        User.team_id == current_user.team_id,
        User.last_active >= fifteen_mins_ago
    ).all()
    live_members = [LiveMember(id=u.id, name=u.name.split(" ")[0]) for u in live_users_query]

    # Recent Activity
    recent = db.query(LeadActivity).filter(LeadActivity.team_id == current_user.team_id).order_by(desc(LeadActivity.timestamp)).limit(10).all()
    recent_activity = []
    
    # Pre-fetch users and leads to avoid N+1
    user_ids = list(set([a.user_id for a in recent]))
    lead_ids = list(set([a.lead_id for a in recent]))
    
    user_map = {u.id: u.name.split(" ")[0] for u in db.query(User).filter(User.id.in_(user_ids)).all()}
    lead_map = {l.id: l.name for l in db.query(FirmLead).filter(FirmLead.id.in_(lead_ids)).all()}
    
    for a in recent:
        name = user_map.get(a.user_id, "Someone")
        target = lead_map.get(a.lead_id, "a lead")
        recent_activity.append(FeedItem(
            name=name if name != current_user.name.split(" ")[0] else "You",
            action=a.action,
            target=target,
            time_ago=time_ago_str(a.timestamp)
        ))

    return DashboardResponse(
        my_stats=stats,
        recent_activity=recent_activity,
        live_members=live_members
    )

# --- LEAD ROUTES ---

@app.post("/api/leads/{lead_id}/activity")
def record_activity(lead_id: str, activity: ActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.team_id:
        raise HTTPException(status_code=400, detail="Must be in a team to record activity")
        
    # Check if this exact action was already recorded by this user for this lead
    existing = db.query(LeadActivity).filter(
        LeadActivity.user_id == current_user.id,
        LeadActivity.lead_id == lead_id,
        LeadActivity.action == activity.action
    ).first()
    
    if not existing:
        new_activity = LeadActivity(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            team_id=current_user.team_id,
            lead_id=lead_id,
            action=activity.action
        )
        db.add(new_activity)
        db.commit()
    
    return {"status": "success"}

@app.get("/api/leads", response_model=SearchResponse)
async def search_leads(
    states: Optional[List[str]] = Query(None, description="List of states to include"),
    exclude_states: Optional[List[str]] = Query(None, description="List of states to exclude"),
    firm_types: Optional[List[str]] = Query(None, description="List of firm types"),
    keywords: Optional[List[str]] = Query(None, description="List of keywords"),
    keyword_logic: Optional[str] = Query("AND", description="AND or OR logic for keywords"),
    reg_after: Optional[str] = Query(None, description="Registration date filter YYYY-MM-DD"),
    has_email: bool = Query(False),
    has_linkedin: bool = Query(False),
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(FirmLead)

    if states:
        valid_states = [s.upper() for s in states if s and s.upper() != "ALL"]
        if valid_states:
            query = query.filter(FirmLead.state.in_(valid_states))
            
    if exclude_states:
        valid_ex_states = [s.upper() for s in exclude_states if s]
        if valid_ex_states:
            query = query.filter(FirmLead.state.notin_(valid_ex_states))
        
    if firm_types:
        valid_types = [t for t in firm_types if t]
        if valid_types:
            query = query.filter(FirmLead.firm_type.in_(valid_types))
        
    if keywords:
        kw_filters = []
        for kw in keywords:
            kw = kw.strip()
            if not kw: continue
            like_kw = f"%{kw.lower()}%"
            kw_filters.append(
                or_(
                    FirmLead.name.ilike(like_kw),
                    FirmLead.city.ilike(like_kw),
                    FirmLead.address.ilike(like_kw),
                    FirmLead.email.ilike(like_kw),
                    FirmLead.website.ilike(like_kw),
                    FirmLead.phone.ilike(like_kw),
                    FirmLead.license_no.ilike(like_kw),
                    FirmLead.firm_type.ilike(like_kw)
                )
            )
        if kw_filters:
            from sqlalchemy import and_
            if keyword_logic.upper() == "OR":
                query = query.filter(or_(*kw_filters))
            else:
                query = query.filter(and_(*kw_filters))
        
    if reg_after:
        query = query.filter(FirmLead.reg_date >= reg_after)
        
    if has_email:
        query = query.filter(FirmLead.email != "", FirmLead.email.isnot(None))
        
    if has_linkedin:
        query = query.filter(FirmLead.linkedin != "", FirmLead.linkedin.isnot(None))
        
    total = query.count()
    results = query.offset(offset).limit(limit).all()

    # Fetch activities for the returned leads
    lead_ids = [r.id for r in results]
    activities = db.query(LeadActivity).filter(LeadActivity.lead_id.in_(lead_ids)).all()
    
    # Pre-fetch users to map IDs to names
    user_ids = list(set([a.user_id for a in activities]))
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    user_map = {u.id: u.name.split(" ")[0] for u in users}
    
    # Map activities to leads
    activity_map = {lid: {"viewedBy": set(), "exportedBy": set()} for lid in lead_ids}
    for a in activities:
        name = user_map.get(a.user_id, "User")
        if a.action == "viewed":
            activity_map[a.lead_id]["viewedBy"].add(name)
        elif a.action == "exported":
            activity_map[a.lead_id]["exportedBy"].add(name)

    leads = [Lead(
        id=r.id,
        name=r.name,
        firm_type=r.firm_type,
        state=r.state,
        city=r.city,
        address=r.address,
        phone=r.phone,
        email=r.email,
        website=r.website,
        linkedin=r.linkedin,
        license_no=r.license_no,
        reg_date=r.reg_date,
        status=r.status,
        source=r.source,
        viewedBy=list(activity_map[r.id]["viewedBy"]),
        exportedBy=list(activity_map[r.id]["exportedBy"]),
        intent_score=r.intent_score or 0
    ) for r in results]

    return SearchResponse(
        state=",".join(states) if states else "ALL",
        total=total,
        returned=len(leads),
        cached=True,
        leads=leads,
    )


@app.get("/api/cache/status")
def cache_status():
    """Show which states are cached and when they expire."""
    return cache.status()


@app.delete("/api/cache/{state}")
def invalidate_cache(state: str):
    """Force re-scrape on next request for a state."""
    state = state.upper()
    cache.invalidate(state)
    return {"message": f"Cache cleared for {state}"}


@app.get("/api/states")
def supported_states():
    return {
        "supported": [
            {"code": "TX", "name": "Texas", "source": "TBPELS CSV roster (daily)"},
            {"code": "CA", "name": "California", "source": "DCA license search"},
            {"code": "NY", "name": "New York", "source": "NY Open.NY.gov API"},
            {"code": "FL", "name": "Florida", "source": "FBPE directory download"},
            {"code": "IL", "name": "Illinois", "source": "IDFPR license search"},
        ]
    }

# --- TEMPORARY SEED ENDPOINT ---
@app.post("/api/seed")
def seed_database(background_tasks: BackgroundTasks):
    import seed
    background_tasks.add_task(seed.main)
    return {"status": "Database seeding started in the background! It will finish in a few minutes."}

@app.get("/api/leads/{lead_id}/signals", response_model=List[IntentSignalResponse])
def get_lead_signals(lead_id: str, force: bool = False, db: Session = Depends(get_db)):
    lead = db.query(FirmLead).filter(FirmLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    should_refresh = force
    if not should_refresh:
        if not lead.signals_last_checked:
            should_refresh = True
        else:
            age_days = (datetime.datetime.utcnow() - lead.signals_last_checked).days
            if age_days >= 7:
                should_refresh = True
            
    if should_refresh:
        fetch_and_cache_signals(lead_id, db)
        db.refresh(lead)
        
    signals = db.query(IntentSignal).filter(IntentSignal.lead_id == lead_id).order_by(desc(IntentSignal.created_at)).all()
    return signals


@app.get("/api/signals/feed")
def get_signals_feed(
    signal_type: Optional[str] = None,  # "hiring" | "social" | "news" | None (all)
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns a paginated feed of the most recent signals across all leads,
    enriched with lead name, state, city, firm_type, and intent_score.
    """
    query = db.query(IntentSignal, FirmLead).join(FirmLead, IntentSignal.lead_id == FirmLead.id)
    
    if signal_type and signal_type in ("hiring", "social", "news"):
        query = query.filter(IntentSignal.signal_type == signal_type)
    
    total = query.count()
    rows = query.order_by(desc(IntentSignal.created_at)).offset(offset).limit(limit).all()
    
    results = []
    for sig, lead in rows:
        results.append({
            "id": sig.id,
            "lead_id": sig.lead_id,
            "lead_name": lead.name,
            "lead_state": lead.state,
            "lead_city": lead.city or "",
            "lead_type": lead.firm_type or "Engineering",
            "lead_intent_score": lead.intent_score or 0,
            "signal_type": sig.signal_type,
            "source": sig.source,
            "title": sig.title,
            "description": sig.description,
            "url": sig.url,
            "score": sig.score,
            "confidence_score": getattr(sig, "confidence_score", 100),
            "raw_company_name": getattr(sig, "raw_company_name", None),
            "created_at": sig.created_at.isoformat() if sig.created_at else None,
        })
    
    return {"total": total, "signals": results}

# --- TEMPORARY INTENT SEED ENDPOINT ---
@app.post("/api/seed-intent")
def seed_intent_data(db: Session = Depends(get_db)):
    import random
    from sqlalchemy.sql.expression import func
    
    # Get 25 random leads that don't have signals yet
    leads = db.query(FirmLead).order_by(func.random()).limit(25).all()
    
    if not leads:
        raise HTTPException(status_code=400, detail="No leads found in database. Seed leads first.")
        
    inserted_signals = 0
    
    job_titles = ["Structural Engineer II", "Civil Design Drafter", "Senior MEP Engineer", "Water Resources Project Manager", "Transportation Engineer"]
    news_headlines = ["wins major municipal infrastructure contract", "announces new regional office expansion", "named top engineering firm to work for in 2026", "partnering on $45M downtown redevelopment project"]
    reddit_topics = ["Anyone here worked at {name}?", "Interview process at {name} - what to expect?", "{name} feedback / reputation in the industry?", "Salary expectation for Senior Engineer at {name}"]
    
    for lead in leads:
        # Clear existing signals
        db.query(IntentSignal).filter(IntentSignal.lead_id == lead.id).delete()
        
        # Set intent score
        lead.intent_score = random.randint(65, 96)
        lead.signals_last_checked = datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 3))
        
        # Add 1 Hiring signal
        hiring_portal = random.choice(["Indeed", "LinkedIn", "ZipRecruiter"])
        title = f"Hiring: {random.choice(job_titles)}"
        sig_hiring = IntentSignal(
            id=str(uuid.uuid4()),
            lead_id=lead.id,
            signal_type="hiring",
            source=hiring_portal,
            title=title,
            description=f"Active job opening for {lead.name} found on {hiring_portal}.",
            url="https://indeed.com" if hiring_portal == "Indeed" else "https://linkedin.com",
            score=85,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(4, 48))
        )
        db.add(sig_hiring)
        
        # Add 1 News signal
        sig_news = IntentSignal(
            id=str(uuid.uuid4()),
            lead_id=lead.id,
            signal_type="news",
            source="Engineering News-Record",
            title=f"{lead.name} {random.choice(news_headlines)}",
            description=f"Recent press release regarding {lead.name}.",
            url="https://enr.com",
            score=60,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 5))
        )
        db.add(sig_news)
        
        # Add 1 Social signal (Reddit)
        sig_reddit = IntentSignal(
            id=str(uuid.uuid4()),
            lead_id=lead.id,
            signal_type="social",
            source="Reddit",
            title=random.choice(reddit_topics).format(name=lead.name),
            description=f"Discussion thread mentioning {lead.name} on r/civilengineering.",
            url="https://reddit.com/r/civilengineering",
            score=70,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(2, 7))
        )
        db.add(sig_reddit)
        
        inserted_signals += 3
        
    db.commit()
    return {"status": "success", "message": f"Seeded intent data for {len(leads)} leads. Added {inserted_signals} mock signals."}


# ─── ADMIN SEED ENDPOINT ──────────────────────────────────────────────────────
# Track seeding progress
_seed_status = {"running": False, "done": False, "total": 0, "error": None}

def _run_seed_background():
    """Runs the full lead seeding in background without dropping users/teams."""
    global _seed_status
    _seed_status = {"running": True, "done": False, "total": 0, "error": None}
    
    import random as _random
    from database import SessionLocal as _SessionLocal, FirmLead as _FirmLead, Base as _Base, engine as _engine
    from sqlalchemy import text as _text

    ALL_STATES = [
        "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
        "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
        "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
        "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
        "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
    ]
    firm_types = ["Civil","Structural","MEP","Geotechnical","Environmental","Electrical","Mechanical","Transportation"]
    cities_map = {
        "TX":["Houston","Dallas","Austin","San Antonio","Fort Worth"],
        "CA":["Los Angeles","San Francisco","San Diego","San Jose","Sacramento"],
        "NY":["New York","Buffalo","Rochester","Albany","Syracuse"],
        "FL":["Miami","Orlando","Tampa","Jacksonville","Tallahassee"],
        "IL":["Chicago","Aurora","Naperville","Springfield","Peoria"],
        "WA":["Seattle","Spokane","Tacoma","Vancouver","Bellevue"],
        "PA":["Philadelphia","Pittsburgh","Allentown","Erie","Reading"],
        "OH":["Columbus","Cleveland","Cincinnati","Toledo","Akron"],
        "GA":["Atlanta","Augusta","Columbus","Macon","Savannah"],
        "NC":["Charlotte","Raleigh","Greensboro","Durham","Winston-Salem"],
        "MI":["Detroit","Grand Rapids","Warren","Sterling Heights","Ann Arbor"],
        "NJ":["Newark","Jersey City","Paterson","Elizabeth","Edison"],
        "VA":["Virginia Beach","Norfolk","Chesapeake","Richmond","Newport News"],
    }
    first_words = ["Apex","Summit","Pinnacle","Quantum","Nexus","Vertex","Meridian","Zenith","Prime","Alpha","Omega","Atlas","Titan","Vanguard","Horizon","Pioneer","Frontier","Sterling","Noble","Crown","Royal","Imperial","Majestic","Grand","Supreme","Paramount","Chief","Master","Elite","Premier"]
    last_words  = ["Build","Construct","Design","Plan","Draft","Map","Chart","Survey","Measure","Assess","Evaluate","Analyze","Test","Inspect","Review","Audit","Certify","Verify","Validate","Approve","Permit","License","Register","Record","Report","Document","File","Store","Archive","Save"]
    streets = ["Main","Oak","Pine","Maple","Cedar","Elm","Washington","Lake","Hill"]

    db = _SessionLocal()
    total_inserted = 0
    try:
        # Only truncate the leads table — leave users/teams intact
        db.execute(_text("DELETE FROM intent_signals"))
        db.execute(_text("DELETE FROM lead_activity"))
        db.execute(_text("DELETE FROM leads"))
        db.commit()

        for state in ALL_STATES:
            _random.seed(state + "_count_massive")
            count = _random.randint(2500, 8000)
            _random.seed(state + "_seed_2")

            state_cities = cities_map.get(state, [f"{state} City", f"North {state}", f"West {state}", f"South {state}", f"East {state}"])
            batch = []
            for i in range(1, count + 1):
                fw = _random.choice(first_words)
                lw = _random.choice(last_words)
                base_name = f"{fw} {lw}"
                suffix = _random.choice(["Engineering","Associates","Consulting","Design","Group","Partners","Solutions","LLC"])
                name = f"{base_name} {suffix}"
                ft = _random.choice(firm_types)
                city = _random.choice(state_cities)
                has_email = _random.choice([True, True, False])
                has_linkedin = _random.choice([True, True, False])
                domain = "".join([c for c in fw.lower() if c.isalnum()])
                batch.append(_FirmLead(
                    id=f"{state}-{i}",
                    name=name,
                    firm_type=ft,
                    state=state,
                    city=city,
                    address=f"{_random.randint(100,9999)} {_random.choice(streets)} St",
                    phone=f"{_random.randint(200,999)}-{_random.randint(200,999)}-{_random.randint(1000,9999)}",
                    email=f"contact@{domain}eng.com" if has_email else "",
                    website=f"{domain}eng.com",
                    linkedin=f"linkedin.com/company/{domain}-engineering" if has_linkedin else "",
                    reg_date=f"{_random.randint(1990,2023)}-{_random.randint(1,12):02d}-{_random.randint(1,28):02d}",
                    license_no=f"{state}-{ft[:2].upper()}-{_random.randint(10000,99999)}",
                    status="Active",
                    source=f"{state} State Board",
                    intent_score=0,
                ))
            db.bulk_save_objects(batch)
            db.commit()
            total_inserted += len(batch)
            logger.info(f"[SEED] {state}: inserted {len(batch)} firms. Running total: {total_inserted}")
            _seed_status["total"] = total_inserted

        _seed_status["running"] = False
        _seed_status["done"] = True
        _seed_status["total"] = total_inserted
        logger.info(f"[SEED] Complete. Total: {total_inserted}")
    except Exception as e:
        db.rollback()
        _seed_status["running"] = False
        _seed_status["error"] = str(e)
        logger.error(f"[SEED] Failed: {e}")
    finally:
        db.close()


@app.post("/api/admin/seed-leads")
def trigger_seed(background_tasks: BackgroundTasks):
    """
    Triggers a full database re-seed as a background task.
    Wipes leads/signals but preserves users & teams.
    Returns immediately — poll /api/admin/seed-status to track progress.
    """
    if _seed_status.get("running"):
        return {"status": "already_running", "total_so_far": _seed_status["total"]}
    background_tasks.add_task(_run_seed_background)
    return {"status": "started", "message": "Seeding started in background. Poll /api/admin/seed-status for progress."}


@app.get("/api/admin/seed-status")
def seed_status():
    """Check the current seed progress."""
    return _seed_status

