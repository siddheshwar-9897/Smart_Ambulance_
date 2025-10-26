// Ambulance Dashboard Functionality
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
    // REGISTER AMBULANCE
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
    // START EMERGENCY ALERT
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
    // UPDATE LOCATION
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