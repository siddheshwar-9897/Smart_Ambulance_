from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# -----------------------
# Users Table
# -----------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)  # hashed password
    role = Column(Enum('ambulance','police','user'), nullable=False)
    full_name = Column(String(100), nullable=False)
    photo_id = Column(String(255), nullable=True)  # Optional image path
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum('active','inactive'), default='active')

    # Relationships
    ambulance = relationship("Ambulance", back_populates="driver", uselist=False)
    alerts = relationship("AmbulanceAlert", back_populates="driver")

# -----------------------
# Ambulance Table
# -----------------------
class Ambulance(Base):
    __tablename__ = "ambulances"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_number = Column(String(20), nullable=False)
    status = Column(Enum('idle','on-duty','emergency'), default='idle')
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    last_update = Column(DateTime, default=datetime.utcnow)

    # Relationships
    driver = relationship("User", back_populates="ambulance")
    alerts = relationship("AmbulanceAlert", back_populates="ambulance")
    locations = relationship("AmbulanceLocation", back_populates="ambulance")

# -----------------------
# Ambulance Alerts Table
# -----------------------
class AmbulanceAlert(Base):
    __tablename__ = "ambulance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(Enum('active','resolved'), default='active')
    origin_lat = Column(Float, nullable=True)
    origin_lng = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)
    police_notified = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    priority_level = Column(String(20), nullable=True)  # 'high', 'medium', 'low'
    estimated_eta = Column(String(50), nullable=True)

    # Relationships
    ambulance = relationship("Ambulance", back_populates="alerts")
    driver = relationship("User", back_populates="alerts")

# -----------------------
# Ambulance Location Table (optional tracking)
# -----------------------
class AmbulanceLocation(Base):
    __tablename__ = "ambulance_locations"

    id = Column(Integer, primary_key=True, index=True)
    ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    ambulance = relationship("Ambulance", back_populates="locations")


