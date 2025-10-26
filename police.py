from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Ambulance, AmbulanceAlert, User

police_router = APIRouter()


# -------------------------
# Get all active ambulance alerts
# -------------------------
@police_router.get("/ambulance-alerts")
def get_active_alerts(db: Session = Depends(get_db)):
    alerts = db.query(AmbulanceAlert).filter(AmbulanceAlert.status == "active").all()
    result = []

    for alert in alerts:
        driver = db.query(User).filter(User.id == alert.driver_id).first()
        ambulance = db.query(Ambulance).filter(Ambulance.id == alert.ambulance_id).first()
        result.append({
            "alert_id": alert.id,
            "ambulance_id": alert.ambulance_id,
            "driver_id": alert.driver_id,
            "driver_name": driver.full_name if driver else None,
            "vehicle_number": ambulance.vehicle_number if ambulance else None,
            "start_time": alert.start_time,
            "status": alert.status,
            "origin_lat": alert.origin_lat,
            "origin_lng": alert.origin_lng,
            "destination_lat": alert.destination_lat,
            "destination_lng": alert.destination_lng,
            "notes": alert.notes,
            "police_notified": alert.police_notified,
            # Add AI fields
            "ai_summary": alert.ai_summary,
            "priority_level": alert.priority_level,
            "estimated_eta": alert.estimated_eta
        })
    return result
# -------------------------
# Get latest location of a specific ambulance
# -------------------------
@police_router.get("/get-location/{ambulance_id}")
def get_ambulance_location(ambulance_id: int, db: Session = Depends(get_db)):
    ambulance = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    
    driver = db.query(User).filter(User.id == ambulance.driver_id).first()

    return {
        "ambulance_id": ambulance.id,
        "driver_id": ambulance.driver_id,
        "driver_name": driver.full_name if driver else None,
        "vehicle_number": ambulance.vehicle_number,
        "current_lat": ambulance.current_lat,
        "current_lng": ambulance.current_lng,
        "last_update": ambulance.last_update,
        "status": ambulance.status
    }
