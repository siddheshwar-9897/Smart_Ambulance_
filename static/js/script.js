// Emergency Response System - Common JavaScript Utilities

class EmergencySystem {
    constructor() {
        this.baseURL = window.location.origin;
        this.setupAxiosInterceptors();
    }

    // Axios configuration and interceptors
    setupAxiosInterceptors() {
        // Request interceptor
        axios.interceptors.request.use(
            (config) => {
                this.showLoading();
                // Add authentication token if available
                const token = localStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                this.hideLoading();
                return Promise.reject(error);
            }
        );

        // Response interceptor
        axios.interceptors.response.use(
            (response) => {
                this.hideLoading();
                return response;
            },
            (error) => {
                this.hideLoading();
                this.handleApiError(error);
                return Promise.reject(error);
            }
        );
    }

    // Loading state management
    showLoading() {
        document.getElementById('loadingSpinner')?.classList.remove('d-none');
        document.body.classList.add('loading');
    }

    hideLoading() {
        document.getElementById('loadingSpinner')?.classList.add('d-none');
        document.body.classList.remove('loading');
    }

    // Error handling
    handleApiError(error) {
        let message = 'An unexpected error occurred';
        
        if (error.response) {
            // Server responded with error status
            message = error.response.data.detail || 
                     error.response.data.message || 
                     `Server error: ${error.response.status}`;
        } else if (error.request) {
            // Request made but no response received
            message = 'Network error: Please check your connection';
        }

        this.showAlert('Error', message, 'error');
    }

    // SweetAlert2 wrapper
    showAlert(title, text, icon = 'info', confirmButtonText = 'OK') {
        return Swal.fire({
            title,
            text,
            icon,
            confirmButtonText,
            customClass: {
                confirmButton: 'btn btn-primary'
            },
            buttonsStyling: false
        });
    }

    // Success message
    showSuccess(message) {
        return this.showAlert('Success!', message, 'success');
    }

    // Confirm dialog
    showConfirm(title, text, confirmButtonText = 'Yes') {
        return Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn btn-danger me-2',
                cancelButton: 'btn btn-secondary'
            },
            buttonsStyling: false
        });
    }

    // Emergency alert confirmation
    showEmergencyConfirm() {
        return Swal.fire({
            title: 'Start Emergency Alert?',
            text: 'This will notify police and emergency services',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Start Emergency!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            customClass: {
                confirmButton: 'btn btn-emergency me-2',
                cancelButton: 'btn btn-secondary'
            },
            buttonsStyling: false
        });
    }

    // Utility functions
    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString();
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    // Local storage utilities
    setAuthData(userData) {
        localStorage.setItem('auth_token', userData.token || '');
        localStorage.setItem('user_id', userData.user_id);
        localStorage.setItem('user_role', userData.role);
        localStorage.setItem('user_name', userData.full_name || '');
    }

    clearAuthData() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
    }

    getAuthData() {
        return {
            token: localStorage.getItem('auth_token'),
            user_id: localStorage.getItem('user_id'),
            role: localStorage.getItem('user_role'),
            full_name: localStorage.getItem('user_name')
        };
    }

    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    }

    // Role-based access
    hasRole(role) {
        const userRole = localStorage.getItem('user_role');
        return userRole === role;
    }

    // Redirect based on role
    redirectByRole() {
        const role = localStorage.getItem('user_role');
        switch (role) {
            case 'ambulance':
                window.location.href = '/ambulance';
                break;
            case 'police':
                window.location.href = '/alert';
                break;
            case 'user':
                window.location.href = '/dashboard';
                break;
            default:
                window.location.href = '/login';
        }
    }
}

// Initialize emergency system
const emergencySystem = new EmergencySystem();

// Utility function for API calls
async function apiCall(method, url, data = null) {
    try {
        const config = {
            method,
            url,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearElement = document.querySelector('#current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Add active class to current page in navbar
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});