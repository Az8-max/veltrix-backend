import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Supabase/Postgres deployment
    # SQLAlchemy 1.4+ requires "postgresql://" instead of "postgres://"
    DATABASE_URL = "postgresql://postgres.bbqxvmwaepjmkggwsems:Azaanzahid%40123@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
    if "pooler.supabase.com" in DATABASE_URL and "postgres:" in DATABASE_URL:
        # If they just copied 'postgres' as the username, append the project ID
        DATABASE_URL = DATABASE_URL.replace("postgres:", "postgres.bbqxvmwaepjmkggwsems:", 1)
        print("Auto-corrected Supabase pooler username to include project ID.")

    # Render free tier resolves to IPv6 which Supabase doesn't support.
    # Use the Supabase Session pooler (port 5432 -> 6543) if available,
    # or force IPv4 resolution.
    import socket
    _original_getaddrinfo = socket.getaddrinfo
    def _ipv4_only_getaddrinfo(*args, **kwargs):
        """Force IPv4 so Render can reach Supabase."""
        responses = _original_getaddrinfo(*args, **kwargs)
        return [r for r in responses if r[0] == socket.AF_INET] or responses
    socket.getaddrinfo = _ipv4_only_getaddrinfo

    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
    )
else:
    # Local SQLite fallback
    SQLALCHEMY_DATABASE_URL = "sqlite:///./leads.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="team")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active = Column(DateTime, nullable=True)

    team = relationship("Team", back_populates="users")

class LeadActivity(Base):
    __tablename__ = "lead_activity"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    team_id = Column(String, ForeignKey("teams.id"), index=True)
    lead_id = Column(String, ForeignKey("leads.id"), index=True)
    action = Column(String) # "viewed" or "exported"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
    team = relationship("Team")
    lead = relationship("FirmLead")

class FirmLead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    firm_type = Column(String, index=True)
    state = Column(String, index=True)
    city = Column(String, index=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    license_no = Column(String, index=True)
    reg_date = Column(String, index=True)
    status = Column(String)
    source = Column(String)
    intent_score = Column(Integer, default=0, index=True)
    signals_last_checked = Column(DateTime, nullable=True)

    signals = relationship("IntentSignal", back_populates="lead", cascade="all, delete-orphan")

class IntentSignal(Base):
    __tablename__ = "intent_signals"

    id = Column(String, primary_key=True, index=True)
    lead_id = Column(String, ForeignKey("leads.id", ondelete="CASCADE"), index=True, nullable=False)
    signal_type = Column(String, index=True)  # 'social', 'news', 'hiring'
    source = Column(String)       # 'Reddit', 'Google News', 'Adzuna'
    title = Column(String)
    description = Column(String, nullable=True)
    url = Column(String, nullable=True)
    score = Column(Integer, default=50)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lead = relationship("FirmLead", back_populates="signals")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables — wrapped so a bad DATABASE_URL logs a warning instead of killing the server
from sqlalchemy import text
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified.")

    # Auto-migration: Ensure new columns exist in the leads table
    try:
        with engine.connect() as conn:
            try:
                conn.execute(text("SELECT intent_score, signals_last_checked FROM leads LIMIT 1"))
            except Exception:
                try:
                    conn.execute(text("ALTER TABLE leads ADD COLUMN intent_score INTEGER DEFAULT 0"))
                    conn.commit()
                except Exception as e:
                    print(f"Migration warning (intent_score): {e}")
                try:
                    conn.execute(text("ALTER TABLE leads ADD COLUMN signals_last_checked TIMESTAMP"))
                    conn.commit()
                except Exception as e:
                    print(f"Migration warning (signals_last_checked): {e}")
    except Exception as e:
        print(f"Migration warning: {e}")

except Exception as e:
    print(f"[CRITICAL] Database connection failed at startup: {e}")
    print("[CRITICAL] Check DATABASE_URL environment variable. Server will start but all DB endpoints will fail.")


