// // Enhanced Dashboard for Emergency Response System
// document.addEventListener("DOMContentLoaded", function() {
//     let currentUser = null;
//     let map = null;
//     let markers = [];

//     // Initialize dashboard
//     initializeDashboard();

//     async function initializeDashboard() {
//         try {
//             // Get current user from auth system
//             currentUser = emergencySystem.getAuthData();
            
//             if (!currentUser || !currentUser.user_id) {
//                 emergencySystem.showAlert('Session Expired', 'Please login again', 'error')
//                     .then(() => {
//                         window.location.href = '/login';
//                     });
//                 return;
//             }

//             // Update UI with user info
//             updateUserInfo();
            
//             // Setup sidebar based on user role
//             setupSidebar();
            
//             // Setup event listeners
//             setupEventListeners();
            
//             // Update time
//             updateDateTime();
//             setInterval(updateDateTime, 60000);

//         } catch (error) {
//             console.error('Dashboard initialization error:', error);
//             emergencySystem.handleApiError(error);
//         }
//     }

//     function updateUserInfo() {
//         document.getElementById('userName').textContent = currentUser.full_name || 'User';
//         document.getElementById('userRole').textContent = currentUser.role || 'Unknown';
//         document.getElementById('sidebarUserName').textContent = currentUser.full_name || 'User';
//         document.getElementById('sidebarUserRole').textContent = currentUser.role || 'Unknown';
//     }

//     function setupSidebar() {
//         const role = currentUser.role;
        
//         // Show/hide role-specific menu items
//         document.querySelectorAll('.police-only, .ambulance-only').forEach(item => {
//             item.style.display = 'none';
//         });

//         if (role === 'police') {
//             document.querySelectorAll('.police-only').forEach(item => {
//                 item.style.display = 'block';
//             });
//             loadQuickStats('police');
//         } else if (role === 'ambulance') {
//             document.querySelectorAll('.ambulance-only').forEach(item => {
//                 item.style.display = 'block';
//             });
//             loadQuickStats('ambulance');
//         } else {
//             loadQuickStats('user');
//         }
//     }

//     function setupEventListeners() {
//         // Navigation
//         document.getElementById('homeLink').addEventListener('click', () => showSection('home'));
//         document.getElementById('mapLink').addEventListener('click', () => showSection('map'));
//         document.getElementById('alertsLink').addEventListener('click', () => showSection('alerts'));
//         document.getElementById('startAlertLink').addEventListener('click', () => showSection('startAlert'));
//         document.getElementById('updateLocationLink').addEventListener('click', () => showSection('updateLocation'));
//         document.getElementById('logoutBtn').addEventListener('click', logoutUser);
        
//         // Refresh buttons
//         document.getElementById('refreshMapBtn')?.addEventListener('click', initializeMap);
//         document.getElementById('refreshAlertsBtn')?.addEventListener('click', loadAlerts);
//     }

//     function showSection(section) {
//         // Hide all sections
//         document.querySelectorAll('#mainContent > div').forEach(div => {
//             div.style.display = 'none';
//         });

//         // Show selected section
//         switch(section) {
//             case 'home':
//                 document.getElementById('welcomeSection').style.display = 'block';
//                 break;
//             case 'map':
//                 if (currentUser.role === 'police') {
//                     document.getElementById('mapSection').style.display = 'block';
//                     initializeMap();
//                 }
//                 break;
//             case 'alerts':
//                 if (currentUser.role === 'police') {
//                     document.getElementById('alertsSection').style.display = 'block';
//                     loadAlerts();
//                 }
//                 break;
//             case 'startAlert':
//                 if (currentUser.role === 'ambulance') {
//                     document.getElementById('startAlertSection').style.display = 'block';
//                     loadStartAlertForm();
//                 }
//                 break;
//             case 'updateLocation':
//                 if (currentUser.role === 'ambulance') {
//                     document.getElementById('updateLocationSection').style.display = 'block';
//                     loadUpdateLocationForm();
//                 }
//                 break;
//         }

//         // Update active nav link
//         document.querySelectorAll('.nav-link').forEach(link => {
//             link.classList.remove('active', 'bg-primary', 'text-white');
//         });
        
//         const activeLink = document.getElementById(section + 'Link') || document.getElementById('homeLink');
//         if (activeLink) {
//             activeLink.classList.add('active', 'bg-primary', 'text-white');
//         }
//     }

//     // -----------------------
//     // POLICE FUNCTIONALITY
//     // -----------------------

//     function initializeMap() {
//         const mapElement = document.getElementById('map');
//         if (!mapElement) return;

//         // Initialize Leaflet map
//         map = L.map('map').setView([18.5204, 73.8567], 12); // Default to Pune

//         L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//             attribution: '© OpenStreetMap contributors'
//         }).addTo(map);

//         // Load ambulance locations
//         loadAmbulanceLocations();
//     }

//     async function loadAmbulanceLocations() {
//         try {
//             // Clear existing markers
//             markers.forEach(marker => map.removeLayer(marker));
//             markers = [];

//             // Get active alerts with locations
//             const alerts = await apiCall('GET', '/police/ambulance-alerts');
            
//             alerts.forEach(alert => {
//                 if (alert.origin_lat && alert.origin_lng) {
//                     const marker = L.marker([alert.origin_lat, alert.origin_lng])
//                         .addTo(map)
//                         .bindPopup(`
//                             <div class="text-center">
//                                 <h6>🚑 Ambulance Alert</h6>
//                                 <p><strong>Driver:</strong> ${alert.driver_name || 'Unknown'}</p>
//                                 <p><strong>Vehicle:</strong> ${alert.vehicle_number || 'Unknown'}</p>
//                                 <p><strong>Status:</strong> <span class="badge bg-warning">${alert.status}</span></p>
//                                 <small>${new Date(alert.start_time).toLocaleString()}</small>
//                             </div>
//                         `);
//                     markers.push(marker);
//                 }
//             });

//             // Adjust map view to show all markers
//             if (markers.length > 0) {
//                 const group = new L.featureGroup(markers);
//                 map.fitBounds(group.getBounds().pad(0.1));
//             }

//         } catch (error) {
//             console.error('Error loading ambulance locations:', error);
//             emergencySystem.handleApiError(error);
//         }
//     }

//     async function loadAlerts() {
//         try {
//             const alerts = await apiCall('GET', '/police/ambulance-alerts');
//             const tbody = document.getElementById('alertsTableBody');
            
//             if (alerts.length === 0) {
//                 tbody.innerHTML = `
//                     <tr>
//                         <td colspan="7" class="text-center text-muted py-4">
//                             <i class="bi bi-check-circle display-4 d-block mb-2 text-success"></i>
//                             No active alerts at the moment
//                         </td>
//                     </tr>
//                 `;
//                 return;
//             }

//             tbody.innerHTML = alerts.map(alert => `
//                 <tr>
//                     <td><strong>#${alert.alert_id}</strong></td>
//                     <td>${alert.driver_name || 'Unknown'}</td>
//                     <td>${alert.vehicle_number || 'Unknown'}</td>
//                     <td>
//                         <span class="badge ${alert.status === 'active' ? 'bg-warning' : 'bg-secondary'}">
//                             ${alert.status}
//                         </span>
//                     </td>
//                     <td>${new Date(alert.start_time).toLocaleString()}</td>
//                     <td>
//                         <small>${alert.origin_lat?.toFixed(4)}, ${alert.origin_lng?.toFixed(4)}</small>
//                     </td>
//                     <td>
//                         <button class="btn btn-sm btn-outline-primary view-location" 
//                                 data-lat="${alert.origin_lat}" 
//                                 data-lng="${alert.origin_lng}">
//                             <i class="bi bi-eye"></i>
//                         </button>
//                     </td>
//                 </tr>
//             `).join('');

//             // Add event listeners to view location buttons
//             tbody.querySelectorAll('.view-location').forEach(btn => {
//                 btn.addEventListener('click', function() {
//                     const lat = parseFloat(this.dataset.lat);
//                     const lng = parseFloat(this.dataset.lng);
//                     if (map && lat && lng) {
//                         map.setView([lat, lng], 15);
//                         L.popup()
//                             .setLatLng([lat, lng])
//                             .setContent('Alert Origin Location')
//                             .openOn(map);
//                     }
//                 });
//             });

//         } catch (error) {
//             console.error('Error loading alerts:', error);
//             emergencySystem.handleApiError(error);
//         }
//     }

//     // -----------------------
//     // AMBULANCE FUNCTIONALITY
//     // -----------------------

//     function loadStartAlertForm() {
//         const container = document.getElementById('startAlertFormContainer');
//         container.innerHTML = `
//             <div class="card">
//                 <div class="card-body">
//                     <form id="startAlertForm">
//                         <div class="row">
//                             <div class="col-md-6">
//                                 <div class="mb-3">
//                                     <label for="ambulanceId" class="form-label">Ambulance ID *</label>
//                                     <input type="number" class="form-control" id="ambulanceId" required>
//                                 </div>
//                                 <div class="mb-3">
//                                     <label for="originLat" class="form-label">Origin Latitude *</label>
//                                     <input type="number" step="any" class="form-control" id="originLat" required>
//                                 </div>
//                                 <div class="mb-3">
//                                     <label for="originLng" class="form-label">Origin Longitude *</label>
//                                     <input type="number" step="any" class="form-control" id="originLng" required>
//                                 </div>
//                             </div>
//                             <div class="col-md-6">
//                                 <div class="mb-3">
//                                     <label for="destinationLat" class="form-label">Destination Latitude</label>
//                                     <input type="number" step="any" class="form-control" id="destinationLat">
//                                 </div>
//                                 <div class="mb-3">
//                                     <label for="destinationLng" class="form-label">Destination Longitude</label>
//                                     <input type="number" step="any" class="form-control" id="destinationLng">
//                                 </div>
//                                 <div class="mb-3">
//                                     <label for="notes" class="form-label">Emergency Notes</label>
//                                     <textarea class="form-control" id="notes" rows="3" placeholder="Describe the emergency..."></textarea>
//                                 </div>
//                             </div>
//                         </div>
//                         <div class="d-grid gap-2 d-md-flex justify-content-md-end">
//                             <button type="button" class="btn btn-outline-secondary me-md-2" id="getCurrentLocationBtn">
//                                 <i class="bi bi-geo-alt me-1"></i>Use Current Location
//                             </button>
//                             <button type="submit" class="btn btn-danger">
//                                 <i class="bi bi-plus-circle me-1"></i>Start Emergency Alert
//                             </button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         `;

//         // Add form event listeners
//         document.getElementById('startAlertForm').addEventListener('submit', handleStartAlert);
//         document.getElementById('getCurrentLocationBtn').addEventListener('click', getCurrentLocation);
//     }

//     function loadUpdateLocationForm() {
//         const container = document.getElementById('updateLocationFormContainer');
//         container.innerHTML = `
//             <div class="card">
//                 <div class="card-body">
//                     <form id="updateLocationForm">
//                         <div class="row">
//                             <div class="col-md-6">
//                                 <div class="mb-3">
//                                     <label for="updateAmbulanceId" class="form-label">Ambulance ID *</label>
//                                     <input type="number" class="form-control" id="updateAmbulanceId" required>
//                                 </div>
//                                 <div class="mb-3">
//                                     <label for="updateLat" class="form-label">Latitude *</label>
//                                     <input type="number" step="any" class="form-control" id="updateLat" required>
//                                 </div>
//                                 <div class="mb-3">
//                                     <label for="updateLng" class="form-label">Longitude *</label>
//                                     <input type="number" step="any" class="form-control" id="updateLng" required>
//                                 </div>
//                             </div>
//                             <div class="col-md-6">
//                                 <div class="d-flex align-items-center justify-content-center h-100">
//                                     <div class="text-center">
//                                         <i class="bi bi-geo-alt display-1 text-primary mb-3"></i>
//                                         <p class="text-muted">Update your current location to help coordinate emergency response</p>
//                                         <button type="button" class="btn btn-primary" id="getUpdateLocationBtn">
//                                             <i class="bi bi-crosshair me-1"></i>Detect My Location
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                         <div class="d-grid">
//                             <button type="submit" class="btn btn-success btn-lg">
//                                 <i class="bi bi-check-circle me-1"></i>Update Location
//                             </button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         `;

//         // Add form event listeners
//         document.getElementById('updateLocationForm').addEventListener('submit', handleUpdateLocation);
//         document.getElementById('getUpdateLocationBtn').addEventListener('click', getUpdateLocation);
//     }

//     async function handleStartAlert(e) {
//         e.preventDefault();
        
//         const formData = {
//             ambulance_id: parseInt(document.getElementById('ambulanceId').value),
//             driver_id: parseInt(currentUser.user_id),
//             origin_lat: parseFloat(document.getElementById('originLat').value),
//             origin_lng: parseFloat(document.getElementById('originLng').value),
//             destination_lat: document.getElementById('destinationLat').value ? 
//                 parseFloat(document.getElementById('destinationLat').value) : null,
//             destination_lng: document.getElementById('destinationLng').value ? 
//                 parseFloat(document.getElementById('destinationLng').value) : null,
//             notes: document.getElementById('notes').value
//         };

//         try {
//             const response = await apiCall('POST', '/start-alert', formData);
//             await emergencySystem.showSuccess('Emergency alert started successfully! Police have been notified.');
//             document.getElementById('startAlertForm').reset();
//         } catch (error) {
//             emergencySystem.handleApiError(error);
//         }
//     }

//     async function handleUpdateLocation(e) {
//         e.preventDefault();
        
//         const formData = {
//             ambulance_id: parseInt(document.getElementById('updateAmbulanceId').value),
//             lat: parseFloat(document.getElementById('updateLat').value),
//             lng: parseFloat(document.getElementById('updateLng').value)
//         };

//         try {
//             const response = await apiCall('POST', '/update-location', formData);
//             await emergencySystem.showSuccess('Location updated successfully!');
//         } catch (error) {
//             emergencySystem.handleApiError(error);
//         }
//     }

//     async function getCurrentLocation() {
//         try {
//             const position = await emergencySystem.getCurrentPosition();
//             document.getElementById('originLat').value = position.lat;
//             document.getElementById('originLng').value = position.lng;
//             emergencySystem.showSuccess('Current location detected!');
//         } catch (error) {
//             emergencySystem.showAlert('Error', 'Could not detect your location. Please enter manually.', 'error');
//         }
//     }

//     async function getUpdateLocation() {
//         try {
//             const position = await emergencySystem.getCurrentPosition();
//             document.getElementById('updateLat').value = position.lat;
//             document.getElementById('updateLng').value = position.lng;
//             emergencySystem.showSuccess('Current location detected!');
//         } catch (error) {
//             emergencySystem.showAlert('Error', 'Could not detect your location. Please enter manually.', 'error');
//         }
//     }

//     // -----------------------
//     // UTILITY FUNCTIONS
//     // -----------------------

//     function loadQuickStats(role) {
//         const container = document.getElementById('quickStats');
//         let statsHTML = '';

//         if (role === 'police') {
//             statsHTML = `
//                 <div class="col-md-4">
//                     <div class="card bg-primary text-white">
//                         <div class="card-body text-center">
//                             <i class="bi bi-bell display-6 mb-2"></i>
//                             <h5 id="activeAlertsCount">Loading...</h5>
//                             <p class="mb-0">Active Alerts</p>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="col-md-4">
//                     <div class="card bg-success text-white">
//                         <div class="card-body text-center">
//                             <i class="bi bi-ambulance display-6 mb-2"></i>
//                             <h5 id="activeAmbulancesCount">Loading...</h5>
//                             <p class="mb-0">Active Ambulances</p>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="col-md-4">
//                     <div class="card bg-info text-white">
//                         <div class="card-body text-center">
//                             <i class="bi bi-clock display-6 mb-2"></i>
//                             <h5 id="responseTime">--</h5>
//                             <p class="mb-0">Avg Response Time</p>
//                         </div>
//                     </div>
//                 </div>
//             `;
//         } else if (role === 'ambulance') {
//             statsHTML = `
//                 <div class="col-md-6">
//                     <div class="card bg-warning text-dark">
//                         <div class="card-body text-center">
//                             <i class="bi bi-activity display-6 mb-2"></i>
//                             <h5>Ready</h5>
//                             <p class="mb-0">Current Status</p>
//                         </div>
//                     </div>
//                 </div>
//                 <div class="col-md-6">
//                     <div class="card bg-info text-white">
//                         <div class="card-body text-center">
//                             <i class="bi bi-geo-alt display-6 mb-2"></i>
//                             <h5>Online</h5>
//                             <p class="mb-0">Location Service</p>
//                         </div>
//                     </div>
//                 </div>
//             `;
//         } else {
//             statsHTML = `
//                 <div class="col-12">
//                     <div class="card bg-light">
//                         <div class="card-body text-center">
//                             <i class="bi bi-person display-6 mb-2 text-primary"></i>
//                             <h5>Welcome to Emergency System</h5>
//                             <p class="mb-0">You have basic access to the emergency response system</p>
//                         </div>
//                     </div>
//                 </div>
//             `;
//         }

//         container.innerHTML = statsHTML;
        
//         // Load actual stats for police
//         if (role === 'police') {
//             loadPoliceStats();
//         }
//     }

//     async function loadPoliceStats() {
//         try {
//             const alerts = await apiCall('GET', '/police/ambulance-alerts');
//             document.getElementById('activeAlertsCount').textContent = alerts.length;
//             document.getElementById('activeAmbulancesCount').textContent = 
//                 new Set(alerts.map(alert => alert.ambulance_id)).size;
//         } catch (error) {
//             console.error('Error loading police stats:', error);
//         }
//     }

//     function updateDateTime() {
//         const now = new Date();
//         document.getElementById('currentTime').textContent = now.toLocaleTimeString();
//         document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
//             weekday: 'long',
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric'
//         });
//     }

//     function logoutUser() {
//         emergencySystem.showConfirm('Logout', 'Are you sure you want to logout?', 'Yes, Logout')
//             .then((result) => {
//                 if (result.isConfirmed) {
//                     emergencySystem.clearAuthData();
//                     emergencySystem.showSuccess('Logged out successfully!')
//                         .then(() => {
//                             window.location.href = '/login';
//                         });
//                 }
//             });
//     }

//     // Initialize with home section
//     showSection('home');
// });


// Ambulance Dashboard Functionality - WITH CORRECTED API URLs
document.addEventListener("DOMContentLoaded", function() {
    let currentUser = null;
    let currentAmbulance = null;

    // Initialize dashboard
    initializeAmbulanceDashboard();

    async function initializeAmbulanceDashboard() {
        try {
            // Get current user from auth system
            currentUser = emergencySystem.getAuthData();
            
            if (!currentUser || !currentUser.user_id) {
                emergencySystem.showAlert('Session Expired', 'Please login again', 'error')
                    .then(() => {
                        window.location.href = '/login';
                    });
                return;
            }

            // Update UI with user info
            updateDashboardInfo();
            
            // Setup event listeners
            setupEventListeners();
            
            // Update time
            updateDateTime();
            setInterval(updateDateTime, 60000);

            // Load initial data
            await loadInitialData();

        } catch (error) {
            console.error('Ambulance dashboard initialization error:', error);
            emergencySystem.handleApiError(error);
        }
    }

    function updateDashboardInfo() {
        document.getElementById('currentTime').textContent = new Date().toLocaleTimeString();
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Pre-fill driver IDs in forms
        document.getElementById('driverId').value = currentUser.user_id;
        document.getElementById('alertDriverId').value = currentUser.user_id;
    }

    function setupEventListeners() {
        // Form submissions
        document.getElementById('registerAmbulanceForm').addEventListener('submit', handleRegisterAmbulance);
        document.getElementById('startAlertForm').addEventListener('submit', handleStartAlert);
        document.getElementById('updateLocationForm').addEventListener('submit', handleUpdateLocation);

        // Location detection buttons
        document.getElementById('getCurrentLocationBtn').addEventListener('click', getCurrentLocationForAlert);
        document.getElementById('detectLocationBtn').addEventListener('click', getCurrentLocationForUpdate);
        document.getElementById('clearLocationBtn').addEventListener('click', clearLocationForm);

        // Refresh buttons
        document.getElementById('refreshHistoryBtn').addEventListener('click', loadAlertHistory);

        // Tab change events
        document.getElementById('alert-tab').addEventListener('click', loadAlertHistory);
        document.getElementById('history-tab').addEventListener('click', loadAlertHistory);
    }

    async function loadInitialData() {
        // Check if user has an ambulance registered
        // This would require a new endpoint - for now, we'll rely on manual input
        // await checkAmbulanceRegistration();
        
        // Load alert history
        await loadAlertHistory();
    }

    // -----------------------
    // REGISTER AMBULANCE - FIXED URL
    // -----------------------

    async function handleRegisterAmbulance(e) {
        e.preventDefault();

        const driverId = parseInt(document.getElementById('driverId').value);
        const vehicleNumber = document.getElementById('vehicleNumber').value.trim();

        if (!driverId || !vehicleNumber) {
            emergencySystem.showAlert('Warning', 'Please fill in all required fields', 'warning');
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-2"></i>Registering...';
        submitBtn.disabled = true;

        try {
            const payload = {
                driver_id: driverId,
                vehicle_number: vehicleNumber
            };

            // ✅ CORRECTED URL: Remove /ambulance prefix
            const response = await apiCall('POST', '/register-ambulance', payload);

            await emergencySystem.showSuccess(
                `Ambulance registered successfully! Ambulance ID: ${response.ambulance_id}`
            );

            // Store ambulance info
            currentAmbulance = {
                id: response.ambulance_id,
                vehicle_number: vehicleNumber,
                driver_id: driverId
            };

            // Update UI
            updateAmbulanceInfo();
            
            // Pre-fill ambulance IDs in other forms
            document.getElementById('alertAmbulanceId').value = response.ambulance_id;
            document.getElementById('locationAmbulanceId').value = response.ambulance_id;

            // Reset form
            e.target.reset();
            document.getElementById('driverId').value = currentUser.user_id;

        } catch (error) {
            emergencySystem.handleApiError(error);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    function updateAmbulanceInfo() {
        if (currentAmbulance) {
            document.getElementById('ambulanceId').textContent = currentAmbulance.id;
            document.getElementById('currentAmbulanceId').textContent = currentAmbulance.id;
            document.getElementById('currentAmbulanceVehicle').textContent = currentAmbulance.vehicle_number;
            
            document.getElementById('currentAmbulanceInfo').style.display = 'block';
            document.getElementById('ambulanceStatus').textContent = 'Registered';
        }
    }

    // -----------------------
    // START EMERGENCY ALERT - FIXED URL
    // -----------------------

    async function handleStartAlert(e) {
        e.preventDefault();

        const ambulanceId = parseInt(document.getElementById('alertAmbulanceId').value);
        const driverId = parseInt(document.getElementById('alertDriverId').value);
        const originLat = parseFloat(document.getElementById('originLat').value);
        const originLng = parseFloat(document.getElementById('originLng').value);
        const destinationLat = document.getElementById('destinationLat').value ? 
            parseFloat(document.getElementById('destinationLat').value) : null;
        const destinationLng = document.getElementById('destinationLng').value ? 
            parseFloat(document.getElementById('destinationLng').value) : null;
        const notes = document.getElementById('emergencyNotes').value.trim();

        // Validation
        if (!ambulanceId || !driverId || !originLat || !originLng) {
            emergencySystem.showAlert('Warning', 'Please fill in all required fields', 'warning');
            return;
        }

        // Confirm emergency alert
        const result = await emergencySystem.showEmergencyConfirm();
        if (!result.isConfirmed) {
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-2"></i>Starting Alert...';
        submitBtn.disabled = true;

        try {
            const payload = {
                ambulance_id: ambulanceId,
                driver_id: driverId,
                origin_lat: originLat,
                origin_lng: originLng,
                destination_lat: destinationLat,
                destination_lng: destinationLng,
                notes: notes
            };

            // ✅ CORRECTED URL: Remove /ambulance prefix
            const response = await apiCall('POST', '/start-alert', payload);

            await emergencySystem.showSuccess(
                `Emergency alert started! Alert ID: ${response.alert_id}. Police have been notified.`
            );

            // Update stats
            document.getElementById('ambulanceStatus').textContent = 'On Emergency';
            document.getElementById('ambulanceStatus').parentElement.parentElement.className = 'card bg-danger text-white';
            document.getElementById('activeAlerts').textContent = '1';

            // Show active alerts section
            document.getElementById('activeAlertsSection').style.display = 'block';
            updateActiveAlertsDisplay(response.alert_id);

            // Reset form but keep ambulance and driver IDs
            document.getElementById('originLat').value = '';
            document.getElementById('originLng').value = '';
            document.getElementById('destinationLat').value = '';
            document.getElementById('destinationLng').value = '';
            document.getElementById('emergencyNotes').value = '';

            // Reload history
            await loadAlertHistory();

        } catch (error) {
            emergencySystem.handleApiError(error);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    function updateActiveAlertsDisplay(alertId) {
        const alertsList = document.getElementById('activeAlertsList');
        alertsList.innerHTML = `
            <div class="col-md-6">
                <div class="alert alert-danger">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="alert-heading">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Active Emergency Alert
                            </h6>
                            <p class="mb-1"><strong>Alert ID:</strong> ${alertId}</p>
                            <p class="mb-1"><strong>Ambulance:</strong> ${document.getElementById('alertAmbulanceId').value}</p>
                            <p class="mb-0"><strong>Started:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-danger fs-6">ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // -----------------------
    // UPDATE LOCATION - FIXED URL
    // -----------------------

    async function handleUpdateLocation(e) {
        e.preventDefault();

        const ambulanceId = parseInt(document.getElementById('locationAmbulanceId').value);
        const lat = parseFloat(document.getElementById('updateLat').value);
        const lng = parseFloat(document.getElementById('updateLng').value);

        if (!ambulanceId || !lat || !lng) {
            emergencySystem.showAlert('Warning', 'Please fill in all required fields', 'warning');
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-2"></i>Updating...';
        submitBtn.disabled = true;

        try {
            const payload = {
                ambulance_id: ambulanceId,
                lat: lat,
                lng: lng
            };

            // ✅ CORRECTED URL: Remove /ambulance prefix
            const response = await apiCall('POST', '/update-location', payload);

            await emergencySystem.showSuccess('Location updated successfully!');

            // Update location status
            document.getElementById('locationStatus').textContent = 'Online';
            document.getElementById('locationStatus').parentElement.parentElement.className = 'card bg-success text-white';

            // Show coordinates
            document.getElementById('locationStatus').innerHTML = `
                ${lat.toFixed(4)}, ${lng.toFixed(4)}
                <br><small>Updated: ${new Date().toLocaleTimeString()}</small>
            `;

        } catch (error) {
            emergencySystem.handleApiError(error);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // -----------------------
    // LOCATION SERVICES
    // -----------------------

    async function getCurrentLocationForAlert() {
        try {
            const position = await emergencySystem.getCurrentPosition();
            document.getElementById('originLat').value = position.lat.toFixed(6);
            document.getElementById('originLng').value = position.lng.toFixed(6);
            emergencySystem.showSuccess('Current location detected for emergency alert!');
        } catch (error) {
            emergencySystem.showAlert('Location Error', 'Could not detect your location. Please enter coordinates manually.', 'error');
        }
    }

    async function getCurrentLocationForUpdate() {
        try {
            const position = await emergencySystem.getCurrentPosition();
            document.getElementById('updateLat').value = position.lat.toFixed(6);
            document.getElementById('updateLng').value = position.lng.toFixed(6);
            emergencySystem.showSuccess('Current location detected!');
        } catch (error) {
            emergencySystem.showAlert('Location Error', 'Could not detect your location. Please enter coordinates manually.', 'error');
        }
    }

    function clearLocationForm() {
        document.getElementById('updateLat').value = '';
        document.getElementById('updateLng').value = '';
    }

    // -----------------------
    // ALERT HISTORY
    // -----------------------

    async function loadAlertHistory() {
        try {
            // Note: This would require a new endpoint to get alerts by driver/ambulance
            // For now, we'll show a placeholder message
            const tbody = document.getElementById('alertHistoryTable');
            
            // Simulate loading
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-hourglass-split display-4 d-block mb-2"></i>
                        Loading alert history...
                    </td>
                </tr>
            `;

            // Simulate API delay
            setTimeout(() => {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted py-4">
                            <i class="bi bi-inbox display-4 d-block mb-2"></i>
                            Alert history feature coming soon<br>
                            <small>This will show your recent emergency alerts</small>
                        </td>
                    </tr>
                `;
            }, 1000);

        } catch (error) {
            console.error('Error loading alert history:', error);
            emergencySystem.handleApiError(error);
        }
    }

    // -----------------------
    // UTILITY FUNCTIONS
    // -----------------------

    function updateDateTime() {
        document.getElementById('currentTime').textContent = new Date().toLocaleTimeString();
    }
});