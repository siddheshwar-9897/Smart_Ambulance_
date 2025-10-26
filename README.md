# 🚑 Smart Ambulance Emergency Response System

A **FastAPI-based emergency response system** designed for real-time coordination between **ambulance drivers**, **police**, and **general users**. This system enables emergency alert management, live location tracking, and quick response monitoring.

---

## **Project Structure**

Smart_Ambulance/
├── backend/
│ ├── main.py # FastAPI app entry
│ ├── models.py # Database models
│ ├── database.py # DB connection
│ ├── crud.py # CRUD operations
│ ├── routes_users.py # User registration/login
│ ├── routes_ambulance.py # Ambulance & alert APIs
│ ├── templates/ # HTML templates
│ │ ├── base.html
│ │ ├── login.html
│ │ ├── register.html
│ │ ├── dashboard.html
│ │ ├── ambulance.html
│ │ └── alert.html
│ ├── static/
│ │ ├── css/
│ │ ├── js/
│ │ │ └── dashboard.js
│ │ └── images/
│ └── create_table.py # DB table creation script
├── venv/ # Python virtual environment
├── .gitignore
└── README.md



---

## **Features**

### **1️⃣ User Roles**
- **General User:** Can view system updates (future expansion for emergency request)
- **Ambulance Driver:** 
  - Register and login
  - Start emergency alert
  - Update current location
- **Police Officer:** 
  - View active ambulance alerts
  - Monitor live ambulance locations on a map
  - Access quick stats for emergency management

---

### **2️⃣ Authentication**
- **User Registration:** `POST /register`
- **User Login:** `POST /login`
- JWT-based authentication planned for secure sessions.

---

### **3️⃣ Ambulance Features**
- **Register Ambulance:** `POST /register-ambulance`
- **Start Alert:** `POST /start-alert`
- **Update Location:** `POST /update-location`

---

### **4️⃣ Police Features**
- **View Live Map:** Shows real-time ambulance locations using Leaflet
- **Active Alerts:** Table showing current emergency alerts with details
- **Quick Stats:** Active alerts, ambulances, average response time

---

### **5️⃣ Frontend**
- HTML templates powered by **Bootstrap 5**
- Dynamic sections based on user role
- Leaflet.js maps for real-time tracking
- Responsive dashboard with alerts, maps, and location forms

---

### **6️⃣ Database**
- **Models:**
  - `User`: Stores user credentials and role
  - `Ambulance`: Ambulance vehicle and driver info
  - `AmbulanceAlert`: Emergency alert details
  - `AmbulanceLocation`: Historical location updates
- Uses **SQLAlchemy ORM** with async support
- SQLite/MySQL compatible

---

### **7️⃣ API Endpoints**

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/register` | POST | All | Register a new user |
| `/login` | POST | All | Login existing user |
| `/register-ambulance` | POST | Ambulance | Register ambulance vehicle |
| `/start-alert` | POST | Ambulance | Start emergency alert |
| `/update-location` | POST | Ambulance | Update ambulance location |
| `/police/ambulance-alerts` | GET | Police | Fetch active alerts with locations |

**Payload Example for Start Alert:**
```json
{
  "ambulance_id": 1,
  "driver_id": 101,
  "origin_lat": 18.5204,
  "origin_lng": 73.8567,
  "destination_lat": 18.5310,
  "destination_lng": 73.8620,
  "notes": "Accident on highway"
}
8️⃣ Installation & Setup
Clone the repository:

bash

git clone https://github.com/your-username/Smart_Ambulance_Backend.git
cd Smart_Ambulance_Backend/backend
Create a virtual environment and activate:

bash

python -m venv venv
source venv/Scripts/activate   # Windows
source venv/bin/activate       # Linux/Mac
Install dependencies:

bash

pip install -r requirements.txt
Create database tables:

bash

python create_table.py
Run FastAPI server:

bash

uvicorn main:app --reload
Open browser:

http://127.0.0.1:8000
9️⃣ Security
Sensitive info like database credentials and API keys are stored in .env (added to .gitignore)

Never commit secrets to GitHub

🔧 Planned Enhancements
Add AI-based alert summarization (Groq API integration)

Add priority levels and ETA calculation for alerts

Push notifications for police and drivers

Role-based JWT authentication for enhanced security


Contributors
Siddheshwar Kadam - Backend & Frontend Development, System Architecture
