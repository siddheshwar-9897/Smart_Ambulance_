# from fastapi import APIRouter, HTTPException, Depends, Form
# from sqlalchemy.orm import Session
# from datetime import datetime
# from database import get_db
# from models import Ambulance, AmbulanceAlert, AmbulanceLocation, User

# ambulance_router = APIRouter()



# @ambulance_router.post("/register-ambulance")
# def register_ambulance(
#     driver_id: int = Form(...),
#     vehicle_number: str = Form(...),
#     db: Session = Depends(get_db)
# ):
#     # Check if driver exists
#     driver = db.query(User).filter(User.id == driver_id, User.role == "ambulance").first()
#     if not driver:
#         raise HTTPException(status_code=404, detail="Driver not found")
    
#     # Check if ambulance already exists for this vehicle number
#     existing = db.query(Ambulance).filter(Ambulance.vehicle_number == vehicle_number).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Vehicle number already registered")
    
#     ambulance = Ambulance(
#         driver_id=driver_id,
#         vehicle_number=vehicle_number,
#         status="idle",
#         current_lat=None,
#         current_lng=None,
#         last_update=datetime.utcnow()
#     )
#     db.add(ambulance)
#     db.commit()
#     db.refresh(ambulance)
#     return {"status": "ambulance registered", "ambulance_id": ambulance.id}


# # -------------------------
# # Start Alert
# # -------------------------
# @ambulance_router.post("/start-alert")
# def start_alert(
#     ambulance_id: int = Form(...),
#     driver_id: int = Form(...),
#     origin_lat: float = Form(...),
#     origin_lng: float = Form(...),
#     destination_lat: float = Form(None),
#     destination_lng: float = Form(None),
#     notes: str = Form(None),
#     db: Session = Depends(get_db)
# ):
#     # Check if ambulance exists
#     ambulance = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
#     if not ambulance:
#         raise HTTPException(status_code=404, detail="Ambulance not found")

#     # Check if driver exists
#     driver = db.query(User).filter(User.id == driver_id, User.role == "ambulance").first()
#     if not driver:
#         raise HTTPException(status_code=404, detail="Driver not found")

#     # Create alert
#     alert = AmbulanceAlert(
#         ambulance_id=ambulance_id,
#         driver_id=driver_id,
#         start_time=datetime.utcnow(),
#         status="active",
#         origin_lat=origin_lat,
#         origin_lng=origin_lng,
#         destination_lat=destination_lat,
#         destination_lng=destination_lng,
#         police_notified=False,
#         notes=notes
#     )
#     db.add(alert)
#     db.commit()
#     db.refresh(alert)
#     return {"status": "alert started", "alert_id": alert.id}


# # -------------------------
# # Update Ambulance Location
# # -------------------------
# @ambulance_router.post("/update-location")
# def update_location(
#     ambulance_id: int = Form(...),
#     lat: float = Form(...),
#     lng: float = Form(...),
#     db: Session = Depends(get_db)
# ):
#     # Check if ambulance exists
#     ambulance = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
#     if not ambulance:
#         raise HTTPException(status_code=404, detail="Ambulance not found")

#     # Update current location in ambulances table
#     ambulance.current_lat = lat
#     ambulance.current_lng = lng
#     ambulance.last_update = datetime.utcnow()
#     db.commit()

#     # Optional: save historical location
#     location = AmbulanceLocation(
#         ambulance_id=ambulance_id,
#         lat=lat,
#         lng=lng,
#         timestamp=datetime.utcnow()
#     )
#     db.add(location)
#     db.commit()

#     return {"status": "location updated", "ambulance_id": ambulance_id}






from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from database import get_db
from models import Ambulance, AmbulanceAlert, AmbulanceLocation, User
import os
from groq import Groq
from math import radians, sin, cos, sqrt, atan2

ambulance_router = APIRouter()

# -------------------------
# Request Schemas
# -------------------------

class RegisterAmbulanceRequest(BaseModel):
    driver_id: int
    vehicle_number: str

class StartAlertRequest(BaseModel):
    ambulance_id: int
    driver_id: int
    origin_lat: float
    origin_lng: float
    destination_lat: float | None = None
    destination_lng: float | None = None
    notes: str | None = None

class UpdateLocationRequest(BaseModel):
    ambulance_id: int
    lat: float
    lng: float

# -------------------------
# AI Emergency Analysis Functions
# -------------------------

def get_ai_emergency_analysis(notes: str, origin_lat: float, origin_lng: float, 
                            destination_lat: float | None, destination_lng: float | None) -> dict:
    """
    Uses Groq API to analyze emergency and generate insights
    """
    try:
        # Initialize Groq client
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        
        # Build context for AI
        context = f"""
        Emergency Details:
        - Situation: {notes or "No details provided"}
        - Origin: {origin_lat}, {origin_lng}
        - Destination: {destination_lat}, {destination_lng} (if provided)
        
        Please analyze this emergency situation and provide:
        1. A concise summary for police dispatch (max 2 sentences)
        2. Priority level (HIGH/MEDIUM/LOW) based on medical urgency
        3. Any specific response recommendations
        
        Format your response as:
        SUMMARY: [police summary here]
        PRIORITY: [HIGH/MEDIUM/LOW]
        NOTES: [any additional insights]
        """
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an emergency response coordinator. Analyze ambulance emergencies and provide clear, actionable insights for police dispatch. Be concise and professional. Always respond in the exact format requested."
                },
                {
                    "role": "user",
                    "content": context
                }
            ],
            model="mixtral-8x7b-32768",
            temperature=0.3,
            max_tokens=300,
        )
        
        response = chat_completion.choices[0].message.content
        
        # Parse the response
        ai_summary = "No AI analysis available"
        priority_level = "medium"
        ai_notes = ""
        
        lines = response.split('\n')
        for line in lines:
            if line.startswith('SUMMARY:'):
                ai_summary = line.replace('SUMMARY:', '').strip()
            elif line.startswith('PRIORITY:'):
                priority_level = line.replace('PRIORITY:', '').strip().lower()
            elif line.startswith('NOTES:'):
                ai_notes = line.replace('NOTES:', '').strip()
        
        return {
            "ai_summary": ai_summary,
            "priority_level": priority_level,
            "ai_notes": ai_notes
        }
        
    except Exception as e:
        print(f"Groq API error: {e}")
        return {
            "ai_summary": "AI analysis temporarily unavailable",
            "priority_level": "medium",
            "ai_notes": "Please review emergency notes manually"
        }

def calculate_eta(origin_lat: float, origin_lng: float, destination_lat: float | None, destination_lng: float | None) -> str:
    """
    Simple ETA calculation using Haversine formula
    """
    if not destination_lat or not destination_lng:
        return "ETA: Destination not specified"
    
    try:
        # Haversine formula for distance calculation
        R = 6371  # Earth radius in km
        
        lat1, lon1 = radians(origin_lat), radians(origin_lng)
        lat2, lon2 = radians(destination_lat), radians(destination_lng)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c  # Distance in km
        
        # Estimate time (assuming 40km/h in city traffic)
        estimated_minutes = int((distance / 40) * 60)
        
        return f"ETA: ~{estimated_minutes} mins"
    
    except Exception as e:
        print(f"ETA calculation error: {e}")
        return "ETA: Calculation failed"

# -------------------------
# Register Ambulance
# -------------------------
@ambulance_router.post("/register-ambulance")
def register_ambulance(data: RegisterAmbulanceRequest, db: Session = Depends(get_db)):
    # Check if driver exists
    driver = db.query(User).filter(User.id == data.driver_id, User.role == "ambulance").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Check if ambulance already exists for this vehicle number
    existing = db.query(Ambulance).filter(Ambulance.vehicle_number == data.vehicle_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle number already registered")
    
    ambulance = Ambulance(
        driver_id=data.driver_id,
        vehicle_number=data.vehicle_number,
        status="idle",
        current_lat=None,
        current_lng=None,
        last_update=datetime.utcnow()
    )
    db.add(ambulance)
    db.commit()
    db.refresh(ambulance)
    return {"status": "ambulance registered", "ambulance_id": ambulance.id}


# -------------------------
# Start Alert with AI Analysis
# -------------------------
@ambulance_router.post("/start-alert")
def start_alert(data: StartAlertRequest, db: Session = Depends(get_db)):
    # Check if ambulance exists
    ambulance = db.query(Ambulance).filter(Ambulance.id == data.ambulance_id).first()
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    # Check if driver exists
    driver = db.query(User).filter(User.id == data.driver_id, User.role == "ambulance").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Get AI analysis
    ai_analysis = get_ai_emergency_analysis(
        data.notes, 
        data.origin_lat, 
        data.origin_lng,
        data.destination_lat,
        data.destination_lng
    )
    
    # Calculate ETA
    eta = calculate_eta(data.origin_lat, data.origin_lng, data.destination_lat, data.destination_lng)

    # Create alert with AI data
    alert = AmbulanceAlert(
        ambulance_id=data.ambulance_id,
        driver_id=data.driver_id,
        start_time=datetime.utcnow(),
        status="active",
        origin_lat=data.origin_lat,
        origin_lng=data.origin_lng,
        destination_lat=data.destination_lat,
        destination_lng=data.destination_lng,
        police_notified=False,
        notes=data.notes,
        ai_summary=ai_analysis["ai_summary"],
        priority_level=ai_analysis["priority_level"],
        estimated_eta=eta
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return {
        "status": "alert started", 
        "alert_id": alert.id,
        "ai_summary": ai_analysis["ai_summary"],
        "priority_level": ai_analysis["priority_level"],
        "estimated_eta": eta
    }


# -------------------------
# Update Ambulance Location
# -------------------------
@ambulance_router.post("/update-location")
def update_location(data: UpdateLocationRequest, db: Session = Depends(get_db)):
    # Check if ambulance exists
    ambulance = db.query(Ambulance).filter(Ambulance.id == data.ambulance_id).first()
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")

    # Update current location in ambulances table
    ambulance.current_lat = data.lat
    ambulance.current_lng = data.lng
    ambulance.last_update = datetime.utcnow()
    db.commit()

    # Optional: save historical location
    location = AmbulanceLocation(
        ambulance_id=data.ambulance_id,
        lat=data.lat,
        lng=data.lng,
        timestamp=datetime.utcnow()
    )
    db.add(location)
    db.commit()

    return {"status": "location updated", "ambulance_id": data.ambulance_id}