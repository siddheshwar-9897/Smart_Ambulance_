from database import engine, Base
from models import User, Ambulance, AmbulanceAlert, AmbulanceLocation

# Create all tables in the database
Base.metadata.create_all(bind=engine)

print("✅ Tables created successfully!")
