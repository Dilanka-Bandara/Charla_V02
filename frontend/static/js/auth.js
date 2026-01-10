const loginForm = document.getElementById('loginForm');
const toggleAuth = document.getElementById('toggleAuth');
const emailField = document.getElementById('emailField');
let isLogin = true;

// Toggle between Login and Register modes
toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    if (isLogin) {
        emailField.classList.add('hidden');
        toggleAuth.innerText = "Need an account? Register";
        document.querySelector('button[type="submit"]').innerText = "Login";
    } else {
        emailField.classList.remove('hidden');
        toggleAuth.innerText = "Have an account? Login";
        document.querySelector('button[type="submit"]').innerText = "Register";
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;

    const endpoint = isLogin ? '/login' : '/register';
    const payload = isLogin 
        ? { username, password } 
        : { username, password, email };

    try {
        const response = await fetch(`http://localhost:8000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            if (isLogin) {
                // Save the Token! This is your key.
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('charla_username', username);
                window.location.href = 'app.html';
            } else {
                alert("Registration successful! Please login.");
                // Switch back to login view automatically
                toggleAuth.click();
            }
        } else {
            alert(data.detail || "Authentication failed");
        }
    } catch (err) {
        console.error(err);
        alert("Server error. Is the backend running?");
    }
});