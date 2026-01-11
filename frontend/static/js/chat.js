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
    // ... existing code ...

const userListContainer = document.querySelector('.flex-1.overflow-y-auto.p-4.space-y-4 ul'); 
// (Note: We will target the UL inside the sidebar. 
// If your HTML structure is different, we might need to add an ID to the sidebar UL)

// 1. UPDATE socket.onmessage
socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    // CASE A: Standard Chat Message
    if (data.type === "message") {
        appendMessage(data.sender, data.content);
    }
    // CASE B: User List Update (NEW)
    else if (data.type === "users_update") {
        updateSidebar(data.users);
    }
    // Backward compatibility (if backend sends raw format)
    else if (data.sender) {
        appendMessage(data.sender, data.content); // Fallback
    }
};

// 2. NEW FUNCTION: Render Sidebar
function updateSidebar(users) {
    // Select the list container (Add id="activeUsersList" to your HTML to make this easier)
    const list = document.getElementById('activeUsersList');
    if (!list) return; // Safety check

    list.innerHTML = ''; // Clear current list

    users.forEach(user => {
        const li = document.createElement('li');
        li.className = "px-3 py-2 hover:bg-slate-700/30 text-slate-300 rounded-md cursor-pointer transition flex items-center gap-2";
        
        // Add Green Dot for Online status
        li.innerHTML = `
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>${user}</span>
            ${user === storedUsername ? '<span class="text-xs text-slate-500">(You)</span>' : ''}
        `;
        
        list.appendChild(li);
    });
}
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