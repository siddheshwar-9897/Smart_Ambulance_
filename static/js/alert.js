// Police Alerts Monitoring Dashboard
document.addEventListener("DOMContentLoaded", function() {
    let currentUser = null;
    let map = null;
    let markers = [];
    let currentAlerts = [];
    let selectedAlert = null;
    let autoRefreshInterval = null;
    let isAutoRefresh = false;

    // Initialize alerts dashboard
    initializeAlertsDashboard();

    async function initializeAlertsDashboard() {
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

            // Check if user has police role
            if (currentUser.role !== 'police') {
                emergencySystem.showAlert('Access Denied', 'This page is for police personnel only', 'error')
                    .then(() => {
                        window.location.href = '/dashboard';
                    });
                return;
            }

            // Update UI with current time
            updateDateTime();
            setInterval(updateDateTime, 60000);

            // Setup event listeners
            setupEventListeners();

            // Initialize map
            initializeMap();

            // Load initial alerts
            await loadAlerts();

        } catch (error) {
            console.error('Alerts dashboard initialization error:', error);
            emergencySystem.handleApiError(error);
        }
    }

    function setupEventListeners() {
        // Control buttons
        document.getElementById('refreshAlertsBtn').addEventListener('click', loadAlerts);
        document.getElementById('autoRefreshToggle').addEventListener('click', toggleAutoRefresh);
        document.getElementById('exportAlertsBtn').addEventListener('click', exportAlerts);

        // Action buttons
        document.getElementById('trackAmbulanceBtn').addEventListener('click', trackAmbulance);
        document.getElementById('notifyPoliceBtn').addEventListener('click', markAsNotified);
        document.getElementById('resolveAlertBtn').addEventListener('click', resolveAlert);
    }

    function updateDateTime() {
        const now = new Date();
        document.getElementById('currentTime').textContent = now.toLocaleTimeString();
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function initializeMap() {
        const mapElement = document.getElementById('alertMap');
        if (!mapElement) return;

        // Initialize Leaflet map
        map = L.map('alertMap').setView([18.5204, 73.8567], 10); // Default view

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add scale control
        L.control.scale().addTo(map);
    }

    async function loadAlerts() {
        try {
            // Show loading state
            const refreshBtn = document.getElementById('refreshAlertsBtn');
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-1"></i>Loading...';
            refreshBtn.disabled = true;

            // Fetch active alerts from API
            const alerts = await apiCall('GET', 'ambulance-alerts');
            currentAlerts = alerts;

            // Update stats
            updateStats(alerts);

            // Update alerts table
            updateAlertsTable(alerts);

            // Update map with alert locations
            updateMapWithAlerts(alerts);

            // Reset refresh button
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;

        } catch (error) {
            console.error('Error loading alerts:', error);
            emergencySystem.handleApiError(error);
            
            // Reset refresh button even on error
            const refreshBtn = document.getElementById('refreshAlertsBtn');
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh Alerts';
            refreshBtn.disabled = false;
        }
    }

    function updateStats(alerts) {
        const activeAlertsCount = alerts.length;
        const activeAmbulancesCount = new Set(alerts.map(alert => alert.ambulance_id)).size;
        const activeDriversCount = new Set(alerts.map(alert => alert.driver_id)).size;

        document.getElementById('activeAlertsCount').textContent = activeAlertsCount;
        document.getElementById('activeAmbulancesCount').textContent = activeAmbulancesCount;
        document.getElementById('activeDriversCount').textContent = activeDriversCount;
        document.getElementById('tableAlertsCount').textContent = activeAlertsCount;

        // Show/hide emergency panel based on alerts
        const emergencyPanel = document.getElementById('emergencyPanel');
        if (activeAlertsCount > 0) {
            emergencyPanel.style.display = 'block';
        } else {
            emergencyPanel.style.display = 'none';
        }
    }

    // function updateAlertsTable(alerts) {
    //     const tbody = document.getElementById('alertsTableBody');
        
    //     if (alerts.length === 0) {
    //         tbody.innerHTML = `
    //             <tr>
    //                 <td colspan="7" class="text-center text-muted py-5">
    //                     <div class="py-4">
    //                         <i class="bi bi-inbox display-4 d-block mb-3 text-muted"></i>
    //                         <h5>No Active Alerts</h5>
    //                         <p class="text-muted mb-0">All emergency alerts are currently resolved</p>
    //                     </div>
    //                 </td>
    //             </tr>
    //         `;
    //         return;
    //     }

    //     tbody.innerHTML = alerts.map(alert => `
    //         <tr class="alert-row ${selectedAlert && selectedAlert.alert_id === alert.alert_id ? 'table-active' : ''}" 
    //             data-alert-id="${alert.alert_id}">
    //             <td>
    //                 <strong class="text-danger">#${alert.alert_id}</strong>
    //             </td>
    //             <td>
    //                 <div>
    //                     <strong>${alert.vehicle_number || 'Unknown'}</strong>
    //                     <br>
    //                     <small class="text-muted">ID: ${alert.ambulance_id}</small>
    //                 </div>
    //             </td>
    //             <td>
    //                 <div>
    //                     <strong>${alert.driver_name || 'Unknown'}</strong>
    //                     <br>
    //                     <small class="text-muted">ID: ${alert.driver_id}</small>
    //                 </div>
    //             </td>
    //             <td>
    //                 <div>
    //                     <strong>${formatDateTime(alert.start_time)}</strong>
    //                     <br>
    //                     <small class="text-muted">${timeSince(alert.start_time)} ago</small>
    //                 </div>
    //             </td>
    //             <td>
    //                 <span class="badge ${getStatusBadgeClass(alert.status)}">
    //                     ${alert.status.toUpperCase()}
    //                 </span>
    //             </td>
    //             <td>
    //                 <span class="badge ${alert.police_notified ? 'bg-success' : 'bg-warning'}">
    //                     ${alert.police_notified ? 'Notified' : 'Pending'}
    //                 </span>
    //             </td>
    //             <td>
    //                 <div class="btn-group btn-group-sm">
    //                     <button class="btn btn-outline-primary view-alert" data-alert-id="${alert.alert_id}">
    //                         <i class="bi bi-eye"></i>
    //                     </button>
    //                     <button class="btn btn-outline-info get-location" data-ambulance-id="${alert.ambulance_id}">
    //                         <i class="bi bi-geo-alt"></i>
    //                     </button>
    //                 </div>
    //             </td>
    //         </tr>
    //     `).join('');
function updateAlertsTable(alerts) {
    const tbody = document.getElementById('alertsTableBody');
    
    tbody.innerHTML = alerts.map(alert => `
        <tr class="alert-row" data-alert-id="${alert.alert_id}">
            <td><strong>#${alert.alert_id}</strong></td>
            <td>
                <strong>${alert.vehicle_number || 'Unknown'}</strong><br>
                <small class="text-muted">${alert.driver_name}</small>
            </td>
            <td>
                <span class="badge ${getPriorityBadgeClass(alert.priority_level)}">
                    ${alert.priority_level ? alert.priority_level.toUpperCase() : 'MEDIUM'}
                </span>
            </td>
            <td>
                <small>${alert.ai_summary || 'No AI analysis'}</small>
            </td>
            <td>${alert.estimated_eta || 'N/A'}</td>
            <td>${formatDateTime(alert.start_time)}</td>
            <td>
                <span class="badge bg-warning">${alert.status}</span>
            </td>
            <td>
                <button class="btn btn-outline-primary btn-sm view-alert" data-alert-id="${alert.alert_id}">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
        // Add event listeners to table rows and buttons
        tbody.querySelectorAll('.alert-row').forEach(row => {
            row.addEventListener('click', function() {
                const alertId = parseInt(this.dataset.alertId);
                selectAlert(alertId);
            });
        });

        tbody.querySelectorAll('.view-alert').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const alertId = parseInt(this.dataset.alertId);
                selectAlert(alertId);
            });
        });

        tbody.querySelectorAll('.get-location').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const ambulanceId = parseInt(this.dataset.ambulanceId);
                await getAmbulanceLocation(ambulanceId);
            });
        });
    }

    function updateMapWithAlerts(alerts) {
        // Clear existing markers
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        if (alerts.length === 0) {
            // Reset to default view if no alerts
            map.setView([18.5204, 73.8567], 10);
            return;
        }

        // Add markers for each alert
        alerts.forEach(alert => {
            if (alert.origin_lat && alert.origin_lng) {
                const marker = L.marker([alert.origin_lat, alert.origin_lng])
                    .addTo(map)
                    .bindPopup(`
                        <div class="text-center">
                            <h6 class="text-danger">🚑 Emergency Alert</h6>
                            <p class="mb-1"><strong>Alert ID:</strong> #${alert.alert_id}</p>
                            <p class="mb-1"><strong>Vehicle:</strong> ${alert.vehicle_number}</p>
                            <p class="mb-1"><strong>Driver:</strong> ${alert.driver_name}</p>
                            <p class="mb-0"><strong>Status:</strong> <span class="badge bg-warning">${alert.status}</span></p>
                            <hr class="my-2">
                            <button class="btn btn-primary btn-sm w-100 view-alert-map" 
                                    data-alert-id="${alert.alert_id}">
                                View Details
                            </button>
                        </div>
                    `);

                markers.push(marker);

                // Add event listener to map popup button
                marker.on('popupopen', function() {
                    document.querySelector('.view-alert-map')?.addEventListener('click', function() {
                        const alertId = parseInt(this.dataset.alertId);
                        selectAlert(alertId);
                    });
                });
            }
        });

        // Adjust map view to show all markers
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    async function selectAlert(alertId) {
        try {
            // Find the alert in current alerts
            const alert = currentAlerts.find(a => a.alert_id === alertId);
            if (!alert) {
                emergencySystem.showAlert('Error', 'Alert not found', 'error');
                return;
            }

            selectedAlert = alert;

            // Update table row selection
            document.querySelectorAll('.alert-row').forEach(row => {
                row.classList.remove('table-active');
                if (parseInt(row.dataset.alertId) === alertId) {
                    row.classList.add('table-active');
                }
            });

            // Update alert details panel
            updateAlertDetails(alert);

            // Get current ambulance location
            await getAmbulanceLocation(alert.ambulance_id);

            // Center map on alert origin
            if (alert.origin_lat && alert.origin_lng) {
                map.setView([alert.origin_lat, alert.origin_lng], 13);
            }

        } catch (error) {
            console.error('Error selecting alert:', error);
            emergencySystem.handleApiError(error);
        }
    }

    function updateAlertDetails(alert) {
        // Show details panel and hide placeholder
        document.getElementById('noAlertSelected').style.display = 'none';
        document.getElementById('alertDetails').style.display = 'block';
        document.getElementById('selectedAlertBadge').style.display = 'inline';

        // Update alert information
        document.getElementById('detailAlertId').textContent = alert.alert_id;
        document.getElementById('detailVehicleNumber').textContent = alert.vehicle_number || 'Unknown';
        document.getElementById('detailDriverName').textContent = alert.driver_name || 'Unknown';
        document.getElementById('detailStartTime').textContent = formatDateTime(alert.start_time);
        document.getElementById('detailStatus').textContent = alert.status.toUpperCase();
        document.getElementById('detailStatus').className = `badge ${getStatusBadgeClass(alert.status)}`;

        // Update location information
        document.getElementById('detailOrigin').textContent = 
            alert.origin_lat && alert.origin_lng ? 
            `${alert.origin_lat.toFixed(4)}, ${alert.origin_lng.toFixed(4)}` : 'Not specified';
        
        document.getElementById('detailDestination').textContent = 
            alert.destination_lat && alert.destination_lng ? 
            `${alert.destination_lat.toFixed(4)}, ${alert.destination_lng.toFixed(4)}` : 'Not specified';

        // Update notes
        document.getElementById('detailNotes').textContent = alert.notes || 'No emergency details provided.';

        // Reset current location until we fetch it
        document.getElementById('detailCurrentLocation').textContent = 'Loading...';
        document.getElementById('detailLastUpdate').textContent = 'Loading...';
    }

    async function getAmbulanceLocation(ambulanceId) {
        try {
            const location = await apiCall('GET', `get-location/${ambulanceId}`);
            
            if (selectedAlert && selectedAlert.ambulance_id === ambulanceId) {
                document.getElementById('detailCurrentLocation').textContent = 
                    location.current_lat && location.current_lng ? 
                    `${location.current_lat.toFixed(4)}, ${location.current_lng.toFixed(4)}` : 'Not available';
                
                document.getElementById('detailLastUpdate').textContent = 
                    location.last_update ? formatDateTime(location.last_update) : 'Never updated';
            }

            // Update marker on map if this ambulance has an active alert
            const alert = currentAlerts.find(a => a.ambulance_id === ambulanceId);
            if (alert && location.current_lat && location.current_lng) {
                updateAmbulanceLocationMarker(ambulanceId, location.current_lat, location.current_lng);
            }

        } catch (error) {
            console.error('Error getting ambulance location:', error);
            if (selectedAlert && selectedAlert.ambulance_id === ambulanceId) {
                document.getElementById('detailCurrentLocation').textContent = 'Error fetching location';
                document.getElementById('detailLastUpdate').textContent = 'Error';
            }
        }
    }




    // Add priority badge styling
function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'high': return 'bg-danger';
        case 'medium': return 'bg-warning text-dark';
        case 'low': return 'bg-success';
        default: return 'bg-secondary';
    }
}

// Update alert details with AI data
function updateAlertDetails(alert) {
    // ... existing code ...
    
    // Update AI fields
    document.getElementById('detailPriority').textContent = alert.priority_level ? alert.priority_level.toUpperCase() : 'MEDIUM';
    document.getElementById('detailAISummary').textContent = alert.ai_summary || 'No AI analysis available';
    document.getElementById('detailETA').textContent = alert.estimated_eta || 'N/A';
    
    // Update priority alert color
    const priorityAlert = document.getElementById('priorityAlert');
    priorityAlert.className = `alert ${getPriorityAlertClass(alert.priority_level)}`;
}

function getPriorityAlertClass(priority) {
    switch (priority) {
        case 'high': return 'alert-danger';
        case 'medium': return 'alert-warning';
        case 'low': return 'alert-success';
        default: return 'alert-info';
    }
}




    function updateAmbulanceLocationMarker(ambulanceId, lat, lng) {
        // Remove existing location marker for this ambulance
        markers = markers.filter(marker => {
            if (marker.ambulanceId === ambulanceId) {
                map.removeLayer(marker);
                return false;
            }
            return true;
        });

        // Add new location marker
        const locationMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        })
        .addTo(map)
        .bindPopup(`
            <div class="text-center">
                <h6>📍 Current Location</h6>
                <p class="mb-1"><strong>Ambulance ID:</strong> ${ambulanceId}</p>
                <p class="mb-0"><strong>Updated:</strong> Just now</p>
            </div>
        `);

        locationMarker.ambulanceId = ambulanceId;
        markers.push(locationMarker);
    }

    // Action Functions
    function trackAmbulance() {
        if (!selectedAlert) {
            emergencySystem.showAlert('Warning', 'Please select an alert first', 'warning');
            return;
        }

        emergencySystem.showAlert('Tracking', `Tracking ambulance ${selectedAlert.vehicle_number}...`, 'info');
        // In a real implementation, this would open a dedicated tracking view
    }

    async function markAsNotified() {
        if (!selectedAlert) {
            emergencySystem.showAlert('Warning', 'Please select an alert first', 'warning');
            return;
        }

        try {
            // This would require a new endpoint to update police_notified status
            // For now, we'll just show a success message
            await emergencySystem.showSuccess(`Police notification marked for alert #${selectedAlert.alert_id}`);
            
            // Update the selected alert locally
            selectedAlert.police_notified = true;
            
            // Update the table row
            const row = document.querySelector(`[data-alert-id="${selectedAlert.alert_id}"]`);
            if (row) {
                const badge = row.querySelector('.badge');
                badge.className = 'badge bg-success';
                badge.textContent = 'Notified';
            }

        } catch (error) {
            emergencySystem.handleApiError(error);
        }
    }

    async function resolveAlert() {
        if (!selectedAlert) {
            emergencySystem.showAlert('Warning', 'Please select an alert first', 'warning');
            return;
        }

        const result = await emergencySystem.showConfirm(
            'Resolve Alert',
            `Are you sure you want to mark alert #${selectedAlert.alert_id} as resolved?`,
            'Yes, Resolve'
        );

        if (result.isConfirmed) {
            // This would require a new endpoint to update alert status
            // For now, we'll just show a success message
            await emergencySystem.showSuccess(`Alert #${selectedAlert.alert_id} marked as resolved`);
            
            // Reload alerts to reflect the change
            await loadAlerts();
            
            // Reset selected alert
            selectedAlert = null;
            document.getElementById('noAlertSelected').style.display = 'block';
            document.getElementById('alertDetails').style.display = 'none';
            document.getElementById('selectedAlertBadge').style.display = 'none';
        }
    }

    function toggleAutoRefresh() {
        const toggleBtn = document.getElementById('autoRefreshToggle');
        
        if (isAutoRefresh) {
            // Stop auto-refresh
            clearInterval(autoRefreshInterval);
            toggleBtn.innerHTML = '<i class="bi bi-play-circle me-1"></i>Auto-Refresh';
            toggleBtn.className = 'btn btn-outline-success';
            isAutoRefresh = false;
            emergencySystem.showSuccess('Auto-refresh disabled');
        } else {
            // Start auto-refresh
            autoRefreshInterval = setInterval(loadAlerts, 30000); // Refresh every 30 seconds
            toggleBtn.innerHTML = '<i class="bi bi-pause-circle me-1"></i>Auto-Refresh';
            toggleBtn.className = 'btn btn-success';
            isAutoRefresh = true;
            emergencySystem.showSuccess('Auto-refresh enabled (30s interval)');
        }
    }

    function exportAlerts() {
        if (currentAlerts.length === 0) {
            emergencySystem.showAlert('Warning', 'No alerts to export', 'warning');
            return;
        }

        // Create CSV content
        const headers = ['Alert ID', 'Ambulance', 'Driver', 'Start Time', 'Status', 'Origin', 'Destination', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...currentAlerts.map(alert => [
                alert.alert_id,
                `"${alert.vehicle_number}"`,
                `"${alert.driver_name}"`,
                `"${formatDateTime(alert.start_time)}"`,
                alert.status,
                `"${alert.origin_lat},${alert.origin_lng}"`,
                `"${alert.destination_lat},${alert.destination_lng}"`,
                `"${(alert.notes || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emergency-alerts-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        emergencySystem.showSuccess('Alerts exported successfully');
    }

    // Utility Functions
    function formatDateTime(dateString) {
        return new Date(dateString).toLocaleString();
    }

    function timeSince(dateString) {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes";
        return Math.floor(seconds) + " seconds";
    }

    function getStatusBadgeClass(status) {
        switch (status.toLowerCase()) {
            case 'active': return 'bg-warning text-dark';
            case 'resolved': return 'bg-success';
            case 'cancelled': return 'bg-secondary';
            default: return 'bg-info';
        }
    }
});