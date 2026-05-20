from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Lead(BaseModel):
    id: str
    name: str
    firm_type: Optional[str] = None       # Civil | Structural | MEP | Engineering
    state: str
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    license_no: Optional[str] = None
    reg_date: Optional[str] = None        # YYYY-MM-DD
    status: Optional[str] = "Active"
    source: str                           # which board/source
    viewedBy: List[str] = []
    exportedBy: List[str] = []
    intent_score: Optional[int] = 0

class IntentSignalResponse(BaseModel):
    id: str
    lead_id: str
    signal_type: str
    source: str
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    score: int
    confidence_score: int
    raw_company_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityCreate(BaseModel):
    action: str

class TeamMemberStats(BaseModel):
    id: str
    name: str
    viewed_count: int
    exported_count: int

class TeamDetailsResponse(BaseModel):
    id: str
    name: str
    created_at: str
    members: List[TeamMemberStats]

class DashboardStats(BaseModel):
    viewed_today: int
    exported_today: int
    viewed_week: int
    exported_week: int
    viewed_month: int
    exported_month: int

class FeedItem(BaseModel):
    name: str
    action: str
    target: str
    time_ago: str

class LiveMember(BaseModel):
    id: str
    name: str

class DashboardResponse(BaseModel):
    my_stats: DashboardStats
    recent_activity: List[FeedItem]
    live_members: List[LiveMember]


class SearchResponse(BaseModel):
    state: str
    total: int
    returned: int
    cached: bool
    leads: List[Lead]

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    team_id: Optional[str]

class TeamCreate(BaseModel):
    name: str

class TeamResponse(BaseModel):
    id: str
    name: str
    created_at: str
