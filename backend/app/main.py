from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.api import auth

app = FastAPI(...)

from app.core.config import settings
from app.db.session import engine, Base, get_db
from app.websockets.manager import manager
from app.db import models

# Create Database Tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)

# CORS: Allow the frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace * with your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Charla API"}

# Add this line before the WebSocket route
app.include_router(auth.router, tags=["Authentication"])

# --- WebSocket Route ---
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        await manager.broadcast(f"{client_id} joined the chat", "System")
        while True:
            data = await websocket.receive_text()
            # Here we will eventually save to DB using 'db' session
            await manager.broadcast(data, client_id)
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast(f"{client_id} left the chat", "System")