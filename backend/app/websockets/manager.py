from fastapi import WebSocket
from typing import Dict
import json

class ConnectionManager:
    def __init__(self):
        # Dictionary to store {username: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket
        # When someone connects, send them the current list immediately
        await self.send_user_list_to_everyone()

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
        # Notify everyone else that this user left
        return self.broadcast_user_list()

    async def send_user_list_to_everyone(self):
        """Sends the list of currently online users to all clients."""
        user_list = list(self.active_connections.keys())
        message = {
            "type": "users_update",
            "users": user_list
        }
        for connection in self.active_connections.values():
            await connection.send_json(message)

    async def broadcast(self, message_content: str, sender: str):
        """Broadcasts a standard chat message."""
        payload = {
            "type": "message",
            "sender": sender,
            "content": message_content
        }
        for connection in self.active_connections.values():
            await connection.send_json(payload)

manager = ConnectionManager()