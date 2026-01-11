// Retrieve the Secure Token saved during Login
const token = localStorage.getItem('token');
const storedUsername = localStorage.getItem('charla_username'); // Only for display before connect

// Redirect if no token found
if (!token) {
    window.location.href = 'index.html';
}

// Update Sidebar UI immediately
document.getElementById('displayUsername').innerText = storedUsername || "User";
document.getElementById('userAvatar').innerText = (storedUsername || "U").charAt(0).toUpperCase();

// --- 🔒 CONNECT SECURELY ---
// We pass the token in the URL query string
const wsUrl = `ws://localhost:8000/ws?token=${token}`;
const socket = new WebSocket(wsUrl);

const chatFeed = document.getElementById('chatFeed');
const connectionStatus = document.getElementById('connectionStatus');

socket.onopen = function(e) {
    connectionStatus.innerText = "● Connected";
    connectionStatus.classList.add("text-green-500");
    connectionStatus.classList.remove("text-slate-500");
    connectionStatus.classList.remove("text-red-500");
};

socket.onclose = function(event) {
    if (event.code === 1008) {
        alert("Session expired. Please login again.");
        window.location.href = 'index.html';
    } else {
        connectionStatus.innerText = "Connection Lost";
        connectionStatus.classList.add("text-red-500");
    }
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    appendMessage(data.sender, data.content);
};

// ... (Rest of the file remains the same: messageForm listener and appendMessage function) ...
// Ensure you keep the 'document.getElementById('messageForm')...' and 'appendMessage' function below this.// ... existing appendMessage function ...

// --- 📜 NEW: Load History Function ---
async function loadHistory() {
    try {
        const response = await fetch('http://localhost:8000/messages?limit=50');
        const messages = await response.json();
        
        // Loop through and display them
        messages.forEach(msg => {
            appendMessage(msg.sender, msg.content);
        });
        
    } catch (err) {
        console.error("Failed to load history:", err);
    }
}

// Call it on startup
loadHistory();