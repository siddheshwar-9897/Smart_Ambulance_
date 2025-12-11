from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import random

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext

from database import SessionLocal, engine
from models import Base, User
from ambulance import ambulance_router
from police import police_router


# ---------------------------
# Lifespan & App Initialization
# ---------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: (optional) cleanup


app = FastAPI(lifespan=lifespan)

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(ambulance_router)
app.include_router(police_router)


# ---------------------------
# Database Dependency
# ---------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------
# Password Hashing (Argon2)
# ---------------------------

pwd_context = CryptContext(
    schemes=["argon2"],  # needs: pip install passlib[argon2]
    deprecated="auto"
)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------
# Mock Current User (Demo Only)
# ---------------------------

def get_current_user(request: Request, db: Session = Depends(get_db)):
    """
    TODO: Replace this with real authentication.
    For now, returns a demo user.
    """
    return {
        "full_name": "Demo User",
        "role": "ambulance"  # change manually while testing
    }


# ---------------------------
# Pydantic Models
# ---------------------------

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: str  # 'ambulance', 'police', 'user'
    photo_id: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


# ---------------------------
# Auth Endpoints
# ---------------------------

@app.post("/register")
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Check existing user
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    user = User(
        username=data.username,
        password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
        photo_id=data.photo_id,
        created_at=datetime.utcnow(),
        status="active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"status": "user registered", "user_id": user.id}


@app.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # TODO: In real app return JWT or session token
    return {
        "status": "login successful",
        "user_id": user.id,
        "role": user.role,
        "full_name": user.full_name
    }


@app.get("/logout")
async def logout():
    """
    Demo logout – in real app, you'd clear session / token.
    """
    return RedirectResponse(url="/register")


# ---------------------------
# Frontend Routes
# ---------------------------

@app.get("/", response_class=HTMLResponse)
async def home(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "title": "Home",
            "current_user": current_user,
            "current_year": datetime.now().year,
        },
    )


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request,
            "title": "Login",
            "current_year": datetime.now().year,
        },
    )


@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse(
        "register.html",
        {
            "request": request,
            "title": "Register",
            "current_year": datetime.now().year,
        },
    )


# ---------------------------
# Role-based Dashboards (Demo)
# ---------------------------

@app.get("/ambulance", response_class=HTMLResponse)
async def ambulance_dashboard(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)

    # DEMO: force role for view; remove in real app
    if current_user["role"] != "ambulance":
        current_user["role"] = "ambulance"

    return templates.TemplateResponse(
        "ambulance.html",
        {
            "request": request,
            "title": "Ambulance Dashboard",
            "current_user": current_user,
            "current_year": datetime.now().year,
        },
    )


@app.get("/alert", response_class=HTMLResponse)
async def alert_dashboard(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)

    # DEMO: force role for view; remove in real app
    if current_user["role"] != "police":
        current_user["role"] = "police"

    return templates.TemplateResponse(
        "alert.html",
        {
            "request": request,
            "title": "Alerts Monitor",
            "current_user": current_user,
            "current_year": datetime.now().year,
        },
    )


@app.get("/dashboard", response_class=HTMLResponse)
async def user_dashboard(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "title": "Dashboard",
            "current_user": current_user,
            "current_year": datetime.now().year,
        },
    )


# ---------------------------
# Redirect Helpers
# ---------------------------

@app.get("/ambulance/dashboard")
async def ambulance_dashboard_redirect():
    return RedirectResponse(url="/ambulance")


@app.get("/police/dashboard")
async def police_dashboard_redirect():
    return RedirectResponse(url="/alert")


# ---------------------------
# Test Pages (for frontend dev)
# ---------------------------

@app.get("/test-auth", response_class=HTMLResponse)
async def test_auth_page(request: Request):
    return templates.TemplateResponse(
        "login.html",
        {
            "request": request,
            "current_year": datetime.now().year,
        },
    )


@app.get("/test-ambulance", response_class=HTMLResponse)
async def test_ambulance_page(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    current_user["role"] = "ambulance"

    return templates.TemplateResponse(
        "ambulance.html",
        {
            "request": request,
            "current_user": current_user,
            "current_year": datetime.now().year,
        },
    )


@app.get("/test-police", response_class=HTMLResponse)
async def test_police_page(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    current_user["role"] = "police"

    return templates.TemplateResponse(
        "alert.html",
        {
            "request": request,
            "current_user": current_user,
            "current_year": datetime.now().year,
        },
    )


# ---------------------------
# Mock APIs for Frontend Testing
# ---------------------------

@app.get("/test-api/alerts")
async def test_alerts():
    return [
        {
            "alert_id": 1,
            "ambulance_id": 1,
            "driver_id": 1,
            "driver_name": "John Doe",
            "vehicle_number": "MH12AB1234",
            "start_time": (datetime.now() - timedelta(minutes=30)).isoformat(),
            "status": "active",
            "origin_lat": 18.5204,
            "origin_lng": 73.8567,
            "destination_lat": 18.5310,
            "destination_lng": 73.8440,
            "notes": "Emergency accident near FC Road",
            "police_notified": False,
        }
    ]


@app.post("/test-api/register-ambulance")
async def test_register_ambulance():
    return {"status": "ambulance registered", "ambulance_id": random.randint(1, 100)}


@app.post("/test-api/start-alert")
async def test_start_alert():
    return {"status": "alert started", "alert_id": random.randint(1, 100)}


@app.post("/test-api/update-location")
async def test_update_location():
    return {"status": "location updated", "ambulance_id": 1}


# ---------------------------
# Health Check
# ---------------------------

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
