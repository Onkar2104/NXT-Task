from contextlib import asynccontextmanager
from datetime import datetime, timezone
import secrets
import string

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = "sqlite:///./growth.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    college = Column(String(200), nullable=False)
    branch = Column(String(100), nullable=False)
    source = Column(String(50), nullable=False, default="direct")
    referral_code = Column(String(20), nullable=False, unique=True, index=True)
    referred_by_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class RegistrationRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    college: str = Field(min_length=2, max_length=200)
    branch: str = Field(min_length=2, max_length=100)
    source: str = Field(default="direct", max_length=50)
    referral_code: str | None = Field(default=None, max_length=20)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def make_referral_code(db: Session) -> str:
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = "NW-" + "".join(secrets.choice(alphabet) for _ in range(6))
        exists = db.query(Student).filter(Student.referral_code == code).first()
        if not exists:
            return code


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="NxtWave Growth Challenge API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/register")
def register(payload: RegistrationRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()

    existing = db.query(Student).filter(Student.email == email).first()
    if existing:
        return {
            "message": "You're already registered.",
            "already_registered": True,
            "student": {
                "name": existing.name,
                "referral_code": existing.referral_code,
            },
        }

    referrer = None
    if payload.referral_code:
        referrer = (
            db.query(Student)
            .filter(Student.referral_code == payload.referral_code.upper().strip())
            .first()
        )
        if not referrer:
            raise HTTPException(status_code=400, detail="Invalid referral code.")

    allowed_sources = {"whatsapp", "club", "referral", "email", "direct"}
    source = payload.source.lower().strip()
    if source not in allowed_sources:
        source = "direct"

    # A referred registration is counted as referral-led unless the
    # caller explicitly used another tracked source.
    if referrer:
        source = "referral"

    student = Student(
        name=payload.name.strip(),
        email=email,
        college=payload.college.strip(),
        branch=payload.branch.strip(),
        source=source,
        referral_code=make_referral_code(db),
        referred_by_id=referrer.id if referrer else None,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "message": "Registration successful.",
        "already_registered": False,
        "student": {
            "id": student.id,
            "name": student.name,
            "referral_code": student.referral_code,
        },
    }


@app.get("/api/referral/{referral_code}")
def referral_details(referral_code: str, db: Session = Depends(get_db)):
    student = (
        db.query(Student)
        .filter(Student.referral_code == referral_code.upper().strip())
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Referral code not found.")

    count = (
        db.query(func.count(Student.id))
        .filter(Student.referred_by_id == student.id)
        .scalar()
    )
    return {
        "name": student.name,
        "referral_code": student.referral_code,
        "referral_count": count,
    }


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    total = db.query(func.count(Student.id)).scalar() or 0

    rows = (
        db.query(Student.source, func.count(Student.id))
        .group_by(Student.source)
        .all()
    )
    counts = {source: count for source, count in rows}

    # Recalculate the leaderboard from all students for clarity.
    all_students = db.query(Student).all()
    referral_counts = {s.id: 0 for s in all_students}
    for s in all_students:
        if s.referred_by_id in referral_counts:
            referral_counts[s.referred_by_id] += 1

    leaderboard = []
    for s in sorted(all_students, key=lambda x: referral_counts[x.id], reverse=True)[:10]:
        leaderboard.append({
            "name": s.name,
            "referral_code": s.referral_code,
            "referrals": referral_counts[s.id],
        })

    targets = {
        "whatsapp": 250,
        "club": 150,
        "referral": 100,
        "email": 0,
        "direct": 0,
    }

    return {
        "total_registrations": total,
        "target": 500,
        "remaining": max(500 - total, 0),
        "source_counts": {
            "whatsapp": counts.get("whatsapp", 0),
            "club": counts.get("club", 0),
            "referral": counts.get("referral", 0),
            "email": counts.get("email", 0),
            "direct": counts.get("direct", 0),
        },
        "source_targets": targets,
        "leaderboard": leaderboard,
    }
