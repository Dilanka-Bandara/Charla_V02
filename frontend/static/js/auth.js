// Check if file is loaded
console.log("Auth.js loaded");

// Select DOM elements
const loginForm = document.getElementById('loginForm');
const toggleAuth = document.getElementById('toggleAuth');
const emailField = document.getElementById('emailField');
const submitBtn = document.querySelector('button[type="submit"]');

// State variable to track if we are Logging in or Registering
let isLogin = true;

// 1. Handle switching between Login and Register modes
toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    
    if (isLogin) {
        // Switch to Login View
        emailField.classList.add('hidden');
        toggleAuth.innerText = "Need an account? Register";
        submitBtn.innerText = "Login";
    } else {
        // Switch to Register View
        emailField.classList.remove('hidden');
        toggleAuth.innerText = "Have an account? Login";
        submitBtn.innerText = "Register";
    }
});

// 2. Handle Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Form submitted...");

    // Get values from inputs
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value; // Only needed for register

    // Determine URL and Data based on mode
    // NOTE: Ensure your Backend is running on port 8000
    const endpoint = isLogin ? '/login' : '/register';
    const url = `http://127.0.0.1:8000${endpoint}`; 
    
    // Prepare the data payload
    let payload;
    if (isLogin) {
        payload = { username: username, password: password };
    } else {
        payload = { username: username, password: password, email: email };
    }

    try {
        console.log(`Sending request to ${url}`, payload);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Server Response:", data);

        if (response.ok) {
            // --- SUCCESS SCENARIO ---
            if (isLogin) {
                // 1. Login Successful: Save the Token
                console.log("Login successful! Saving token...");
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('charla_username', username);
                
                // 2. Redirect to Chat Page
                console.log("Redirecting to app.html...");
                window.location.href = 'app.html';
            } else {
                // 3. Registration Successful
                alert("Registration successful! Please login.");
                // Automatically switch back to login mode
                toggleAuth.click();
            }
        } else {
            // --- FAILURE SCENARIO ---
            // Backend returned an error (e.g., "Wrong password")
            alert(data.detail || "Authentication failed. Check your inputs.");
        }

    } catch (err) {
        // Network Error (e.g., Server is offline)
        console.error("Network Error:", err);
        alert("Could not connect to server. Is the backend running?");
    }
});