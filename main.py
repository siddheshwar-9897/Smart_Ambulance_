# from fastapi import FastAPI, HTTPException, Depends, Request, Form
# from fastapi.responses import HTMLResponse
# from fastapi.staticfiles import StaticFiles
# from fastapi.templating import Jinja2Templates
# from sqlalchemy.orm import Session
# from database import SessionLocal, engine
# from models import Base, User
# from passlib.context import CryptContext
# from datetime import datetime
# from ambulance import ambulance_router
# from police import police_router







# # Initialize FastAPI
# app = FastAPI()
# templates = Jinja2Templates(directory="templates")
# app.mount("/static", StaticFiles(directory="static"), name="static")



# # Include routers
# # app.include_router(auth_router)
# app.include_router(ambulance_router)
# app.include_router(police_router)  # will add later






# from fastapi.responses import HTMLResponse

# # ---------------------------
# # Frontend Routes
# # ---------------------------

# # @app.get("/", response_class=HTMLResponse)
# # async def home(request: Request):
# #     return templates.TemplateResponse("dashboard.html", {"request": request, "title": "Dashboard"})

# # @app.get("/login", response_class=HTMLResponse)
# # async def login_page(request: Request):
# #     return templates.TemplateResponse("login.html", {"request": request, "title": "Login"})

# # @app.get("/register", response_class=HTMLResponse)
# # async def register_page(request: Request):
# #     return templates.TemplateResponse("register.html", {"request": request, "title": "Register"})

# # @app.get("/dashboard", response_class=HTMLResponse)
# # async def dashboard_page(request: Request):
# #     return templates.TemplateResponse("dashboard.html", {"request": request, "title": "Dashboard"})

# # @app.get("/ambulance", response_class=HTMLResponse)
# # async def ambulance_page(request: Request):
# #     return templates.TemplateResponse("ambulance.html", {"request": request, "title": "Ambulance Dashboard"})

# # @app.get("/alert", response_class=HTMLResponse)
# # async def alert_page(request: Request):
# #     return templates.TemplateResponse("alert.html", {"request": request, "title": "Alerts Monitor"})

# # # Add these test routes for development
# # @app.get("/test-auth", response_class=HTMLResponse)
# # async def test_auth_page(request: Request):
# #     """Test page to check authentication flow"""
# #     return templates.TemplateResponse("login.html", {"request": request})

# # @app.get("/test-ambulance", response_class=HTMLResponse)
# # async def test_ambulance_page(request: Request):
# #     """Test page for ambulance features"""
# #     return templates.TemplateResponse("ambulance.html", {"request": request})




# # ---------------------------
# # Frontend Routes
# # ---------------------------

# @app.get("/", response_class=HTMLResponse)
# async def home(request: Request):
#     return templates.TemplateResponse("dashboard.html", {"request": request, "title": "Home"})

# @app.get("/login", response_class=HTMLResponse)
# async def login_page(request: Request):
#     return templates.TemplateResponse("login.html", {"request": request, "title": "Login"})

# @app.get("/register", response_class=HTMLResponse)
# async def register_page(request: Request):
#     return templates.TemplateResponse("register.html", {"request": request, "title": "Register"})

# # 🔑 ROLE-BASED DASHBOARDS
# @app.get("/ambulance", response_class=HTMLResponse)
# async def ambulance_dashboard(request: Request):
#     return templates.TemplateResponse("ambulance.html", {"request": request, "title": "Ambulance Dashboard"})

# @app.get("/alert", response_class=HTMLResponse)
# async def alert_dashboard(request: Request):
#     return templates.TemplateResponse("alert.html", {"request": request, "title": "Alerts Monitor"})

# @app.get("/dashboard", response_class=HTMLResponse)
# async def user_dashboard(request: Request):
#     return templates.TemplateResponse("dashboard.html", {"request": request, "title": "Dashboard"})

# # 🚨 ADD THESE REDIRECT ROUTES TO FIX 404 ERRORS
# @app.get("/ambulance/dashboard", response_class=HTMLResponse)
# async def ambulance_dashboard_redirect(request: Request):
#     """Redirect from /ambulance/dashboard to /ambulance"""
#     from fastapi.responses import RedirectResponse
#     return RedirectResponse(url="/ambulance")

# @app.get("/police/dashboard", response_class=HTMLResponse)
# async def police_dashboard_redirect(request: Request):
#     """Redirect from /police/dashboard to /alert"""
#     from fastapi.responses import RedirectResponse
#     return RedirectResponse(url="/alert")




# # Password hashing
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # Dependency for DB
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # ---------------------------
# # Helper functions
# # ---------------------------
# def get_password_hash(password):
#     return pwd_context.hash(password)

# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)

# # ---------------------------
# # User Registration
# # ---------------------------
# # @app.post("/register")
# # async def register(
# #     username: str = Form(...),
# #     password: str = Form(...),
# #     full_name: str = Form(...),
# #     role: str = Form(...),  # 'ambulance', 'police', 'user'
# #     photo_id: str = Form(None),
# #     db: Session = Depends(get_db)
# # ):
# #     # Check if username exists
# #     existing_user = db.query(User).filter(User.username == username).first()
# #     if existing_user:
# #         raise HTTPException(status_code=400, detail="Username already registered")

# #     user = User(
# #         username=username,
# #         password=get_password_hash(password),
# #         full_name=full_name,
# #         role=role,
# #         photo_id=photo_id,
# #         created_at=datetime.utcnow(),
# #         status="active"
# #     )
# #     db.add(user)
# #     db.commit()
# #     db.refresh(user)
# #     return {"status": "user registered", "user_id": user.id}

# # # ---------------------------
# # # User Login
# # # ---------------------------
# # @app.post("/login")
# # async def login(
# #     username: str = Form(...),
# #     password: str = Form(...),
# #     db: Session = Depends(get_db)
# # ):
# #     user = db.query(User).filter(User.username == username).first()
# #     if not user or not verify_password(password, user.password):
# #         raise HTTPException(status_code=401, detail="Invalid credentials")
# #     return {"status": "login successful", "user_id": user.id, "role": user.role}


# from pydantic import BaseModel
# # ---------------------------
# # Request Models
# # ---------------------------
# class RegisterRequest(BaseModel):
#     username: str
#     password: str
#     full_name: str
#     role: str  # 'ambulance', 'police', 'user'
#     photo_id: str | None = None

# class LoginRequest(BaseModel):
#     username: str
#     password: str

# # ---------------------------
# # User Registration
# # ---------------------------
# @app.post("/register")
# async def register(data: RegisterRequest, db: Session = Depends(get_db)):
#     existing_user = db.query(User).filter(User.username == data.username).first()
#     if existing_user:
#         raise HTTPException(status_code=400, detail="Username already registered")

#     user = User(
#         username=data.username,
#         password=get_password_hash(data.password),
#         full_name=data.full_name,
#         role=data.role,
#         photo_id=data.photo_id,
#         created_at=datetime.utcnow(),
#         status="active"
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)

#     return {"status": "user registered", "user_id": user.id}


# # ---------------------------
# # User Login
# # ---------------------------
# @app.post("/login")
# async def login(data: LoginRequest, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.username == data.username).first()
#     if not user or not verify_password(data.password, user.password):
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     return {
#         "status": "login successful",
#         "user_id": user.id,
#         "role": user.role
#     }









from fastapi import FastAPI, HTTPException, Depends, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User
from passlib.context import CryptContext
from datetime import datetime
from ambulance import ambulance_router
from police import police_router

# Initialize FastAPI
app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(ambulance_router)
app.include_router(police_router)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependency for DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------
# Helper functions
# ---------------------------
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# ---------------------------
# Authentication & User Context
# ---------------------------
# In a real app, you would use proper session management or JWT tokens
# For now, we'll use a simple mock for demonstration
def get_current_user(request: Request, db: Session = Depends(get_db)):
    """
    Mock function to get current user - replace with proper authentication
    In production, you would get user from session/token
    """
    # For demo purposes, return a mock user
    # You can modify this to get user from session or token
    return {
        "full_name": "Demo User",
        "role": "ambulance"  # Change this to test different roles
    }

# ---------------------------
# Request Models
# ---------------------------
from pydantic import BaseModel

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
# User Registration
# ---------------------------
@app.post("/register")
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
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

# ---------------------------
# User Login
# ---------------------------
@app.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "status": "login successful",
        "user_id": user.id,
        "role": user.role,
        "full_name": user.full_name
    }

# ---------------------------
# Logout Route
# ---------------------------
@app.get("/logout")
async def logout():
    """Logout route - redirects to login page"""
    return RedirectResponse(url="/register")

# ---------------------------
# Frontend Routes with User Context
# ---------------------------

@app.get("/", response_class=HTMLResponse)
async def home(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    return templates.TemplateResponse("dashboard.html", {
        "request": request, 
        "title": "Home",
        "current_user": current_user,
        "current_year": datetime.now().year
    })

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    # No current_user for login page
    return templates.TemplateResponse("login.html", {
        "request": request, 
        "title": "Login",
        "current_year": datetime.now().year
    })

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    # No current_user for register page
    return templates.TemplateResponse("register.html", {
        "request": request, 
        "title": "Register",
        "current_year": datetime.now().year
    })

# 🔑 ROLE-BASED DASHBOARDS
@app.get("/ambulance", response_class=HTMLResponse)
async def ambulance_dashboard(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    # Ensure user has ambulance role
    if current_user["role"] != "ambulance":
        current_user["role"] = "ambulance"  # Force for demo
    
    return templates.TemplateResponse("ambulance.html", {
        "request": request, 
        "title": "Ambulance Dashboard",
        "current_user": current_user,
        "current_year": datetime.now().year
    })

@app.get("/alert", response_class=HTMLResponse)
async def alert_dashboard(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    # Ensure user has police role
    if current_user["role"] != "police":
        current_user["role"] = "police"  # Force for demo
    
    return templates.TemplateResponse("alert.html", {
        "request": request, 
        "title": "Alerts Monitor",
        "current_user": current_user,
        "current_year": datetime.now().year
    })

@app.get("/dashboard", response_class=HTMLResponse)
async def user_dashboard(request: Request, db: Session = Depends(get_db)):
    current_user = get_current_user(request, db)
    return templates.TemplateResponse("dashboard.html", {
        "request": request, 
        "title": "Dashboard",
        "current_user": current_user,
        "current_year": datetime.now().year
    })

# 🚨 REDIRECT ROUTES TO FIX 404 ERRORS
@app.get("/ambulance/dashboard")
async def ambulance_dashboard_redirect():
    """Redirect from /ambulance/dashboard to /ambulance"""
    return RedirectResponse(url="/ambulance")

@app.get("/police/dashboard")
async def police_dashboard_redirect():
    """Redirect from /police/dashboard to /alert"""
    return RedirectResponse(url="/alert")

# ---------------------------
# Test Routes for Development
# ---------------------------
@app.get("/test-auth", response_class=HTMLResponse)
async def test_auth_page(request: Request):
    """Test page to check authentication flow"""
    return templates.TemplateResponse("login.html", {
        "request": request,
        "current_year": datetime.now().year
    })

@app.get("/test-ambulance", response_class=HTMLResponse)
async def test_ambulance_page(request: Request, db: Session = Depends(get_db)):
    """Test page for ambulance features"""
    current_user = get_current_user(request, db)
    current_user["role"] = "ambulance"  # Force ambulance role
    
    return templates.TemplateResponse("ambulance.html", {
        "request": request,
        "current_user": current_user,
        "current_year": datetime.now().year
    })

@app.get("/test-police", response_class=HTMLResponse)
async def test_police_page(request: Request, db: Session = Depends(get_db)):
    """Test page for police features"""
    current_user = get_current_user(request, db)
    current_user["role"] = "police"  # Force police role
    
    return templates.TemplateResponse("alert.html", {
        "request": request,
        "current_user": current_user,
        "current_year": datetime.now().year
    })

# ---------------------------
# API Test Endpoints for Frontend Development
# ---------------------------
from datetime import datetime, timedelta
import random

@app.get("/test-api/alerts")
async def test_alerts():
    """Mock API endpoint for frontend testing"""
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
            "police_notified": False
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

# Create database tables
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)