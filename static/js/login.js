// Login functionality for Emergency Response System
document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    // Focus on username field when page loads
    usernameInput.focus();

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Validation
        if (!username || !password) {
            emergencySystem.showAlert('Warning', 'Please fill in all fields', 'warning');
            return;
        }

        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-2"></i>Logging in...';
        submitBtn.disabled = true;

        // try {
        //     // API call to login endpoint
        //     const response = await apiCall('POST', '/login', {
        //         username: username,
        //         password: password
        //     });

        //     // Store authentication data
        //     emergencySystem.setAuthData({
        //         user_id: response.user_id,
        //         role: response.role,
        //         token: 'session_active' // Since no JWT in current backend
        //     });

        //     // Show success message
        //     await emergencySystem.showSuccess(`Welcome back! Redirecting to ${response.role} dashboard...`);

        //     // Redirect based on user role
        //     emergencySystem.redirectByRole();

        // }
        try {
    // API call to login endpoint
    const response = await apiCall('POST', '/login', {
        username: username,
        password: password
    });

    // Store authentication data
    emergencySystem.setAuthData({
        user_id: response.user_id,
        role: response.role,
        full_name: username, // You might want to get this from backend
        token: 'session_active'
    });

    // Show success message
    await emergencySystem.showSuccess(`Welcome! Redirecting to ${response.role} dashboard...`);

    // ✅ FIXED: Use the correct redirect function
    emergencySystem.redirectByRole();

}catch (error) {
             console.error('Login error:', error);
        
        
            // Handle specific error cases
            if (error.response && error.response.status === 401) {
                emergencySystem.showAlert('Login Failed', 'Invalid username or password', 'error');
            } else if (error.response && error.response.status === 404) {
                emergencySystem.showAlert('Service Error', 'Login service unavailable', 'error');
            } else {
                emergencySystem.handleApiError(error);
            }

            // Reset form state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // Enter key navigation
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInput.focus();
        }
    });

    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // Check if user is already logged in
    if (emergencySystem.isAuthenticated()) {
        emergencySystem.showAlert('Already Logged In', 'You are already logged in. Redirecting...', 'info')
            .then(() => {
                emergencySystem.redirectByRole();
            });
    }
});