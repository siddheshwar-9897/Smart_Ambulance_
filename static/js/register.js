// Registration functionality for Emergency Response System
document.addEventListener("DOMContentLoaded", function() {
    const registerForm = document.getElementById("registerForm");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm_password");
    const passwordStrength = document.getElementById("passwordStrength");
    const passwordMatch = document.getElementById("passwordMatch");

    // Password strength checker
    passwordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);
        updatePasswordStrength(strength);
        checkPasswordMatch();
    });

    // Confirm password match checker
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);

    function calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
        if (password.match(/\d/)) strength += 25;
        if (password.match(/[^a-zA-Z\d]/)) strength += 25;
        
        return strength;
    }

    function updatePasswordStrength(strength) {
        passwordStrength.style.width = strength + '%';
        
        if (strength < 50) {
            passwordStrength.className = 'progress-bar bg-danger';
        } else if (strength < 75) {
            passwordStrength.className = 'progress-bar bg-warning';
        } else {
            passwordStrength.className = 'progress-bar bg-success';
        }
    }

    function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword === '') {
            passwordMatch.textContent = '';
            passwordMatch.className = 'form-text';
            return true;
        }
        
        if (password === confirmPassword) {
            passwordMatch.textContent = '✓ Passwords match';
            passwordMatch.className = 'form-text text-success';
            return true;
        } else {
            passwordMatch.textContent = '✗ Passwords do not match';
            passwordMatch.className = 'form-text text-danger';
            return false;
        }
    }

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get form values
        const full_name = document.getElementById("full_name").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const confirm_password = document.getElementById("confirm_password").value;
        const role = document.getElementById("role").value;
        const photo_id = document.getElementById("photo_id").value.trim() || null;

        // Validation
        if (!full_name || !username || !password || !confirm_password || !role) {
            emergencySystem.showAlert('Warning', 'Please fill in all required fields', 'warning');
            return;
        }

        if (password.length < 6) {
            emergencySystem.showAlert('Warning', 'Password must be at least 6 characters long', 'warning');
            return;
        }

        if (!checkPasswordMatch()) {
            emergencySystem.showAlert('Warning', 'Passwords do not match', 'warning');
            return;
        }

        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-2"></i>Creating Account...';
        submitBtn.disabled = true;

        try {
            // Prepare payload matching backend RegisterRequest
            const payload = {
                username: username,
                password: password,
                full_name: full_name,
                role: role,
                photo_id: photo_id
            };

            // API call to register endpoint
            const response = await apiCall('POST', '/register', payload);

            // Show success message
            await emergencySystem.showSuccess(
                `Account created successfully! Welcome to the ${role} team. Redirecting to login...`
            );

            // Redirect to login page after successful registration
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle specific error cases
            if (error.response && error.response.status === 400) {
                if (error.response.data.detail.includes("already registered")) {
                    emergencySystem.showAlert('Username Taken', 'This username is already registered. Please choose another.', 'error');
                } else {
                    emergencySystem.showAlert('Registration Failed', error.response.data.detail, 'error');
                }
            } else {
                emergencySystem.handleApiError(error);
            }

            // Reset form state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Real-time username availability check (optional enhancement)
    let usernameTimeout;
    const usernameInput = document.getElementById('username');
    
    usernameInput.addEventListener('input', function() {
        clearTimeout(usernameTimeout);
        const username = this.value.trim();
        
        if (username.length >= 3) {
            usernameTimeout = setTimeout(async () => {
                // Could implement username availability check here
                console.log('Checking username:', username);
            }, 500);
        }
    });

    // Enter key navigation
    const inputs = registerForm.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    registerForm.dispatchEvent(new Event('submit'));
                }
            }
        });
    });
});