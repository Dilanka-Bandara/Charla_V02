const username = localStorage.getItem('charla_username');

// Redirect if no username
if (!username) {
    window.location.href = 'index.html';
}

// Update Sidebar UI
document.getElementById('displayUsername').innerText = username;
document.getElementById('userAvatar').innerText = username.charAt(0).toUpperCase();

// --- WebSocket Connection ---
// NOTE: "localhost:8000" matches your Uvicorn backend port
const wsUrl = `ws://localhost:8000/ws/${username}`;
const socket = new WebSocket(wsUrl);

const chatFeed = document.getElementById('chatFeed');
const connectionStatus = document.getElementById('connectionStatus');

socket.onopen = function(e) {
    connectionStatus.innerText = "● Connected";
    connectionStatus.classList.add("text-green-500");
    connectionStatus.classList.remove("text-slate-500");
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    appendMessage(data.sender, data.content);
};

socket.onclose = function(event) {
    if (event.wasClean) {
        connectionStatus.innerText = "Disconnected";
    } else {
        connectionStatus.innerText = "Connection Lost (Server Offline)";
        connectionStatus.classList.add("text-red-500");
    }
};

// --- Sending Messages ---
document.getElementById('messageForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const message = input.value;

    if (message) {
        socket.send(message); // Send to backend
        input.value = '';
    }
});

// --- UI Helper: Append Message ---
function appendMessage(sender, text) {
    const isMe = sender === username;
    const isSystem = sender === "System";

    const div = document.createElement('div');
    div.classList.add('flex', 'flex-col', 'space-y-1', 'message-enter');
    
    if (isSystem) {
        div.innerHTML = `
            <div class="flex justify-center my-2">
                <span class="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">${text}</span>
            </div>
        `;
    } else {
        div.classList.add(isMe ? 'items-end' : 'items-start');
        
        div.innerHTML = `
            <div class="flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr ${isMe ? 'from-blue-500 to-indigo-500' : 'from-slate-600 to-slate-500'} flex items-center justify-center text-xs font-bold text-white shrink-0">
                    ${sender.charAt(0).toUpperCase()}
                </div>
                <div class="max-w-md px-4 py-2 rounded-2xl text-sm shadow-md ${
                    isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-700 text-slate-200 rounded-tl-none'
                }">
                    <p>${text}</p>
                </div>
            </div>
            <span class="text-[10px] text-slate-500 ${isMe ? 'mr-12' : 'ml-12'}">Just now</span>
        `;
    }

    chatFeed.appendChild(div);
    chatFeed.scrollTop = chatFeed.scrollHeight; // Auto-scroll to bottom
}