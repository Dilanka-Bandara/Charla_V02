from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.websockets.manager import manager
from app.api import auth  # Import the auth routes we made

# 1. Create Database Tables automatically on startup
Base.metadata.create_all(bind=engine)

# 2. Initialize the App (FIXED LINE)
app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)

# 3. CORS Configuration (Allows frontend to talk to backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Include the Auth Router (Login/Register)
app.include_router(auth.router, tags=["Authentication"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Charla API"}

# 5. The WebSocket Endpoint
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        # Notify others
        await manager.broadcast(f"{client_id} joined the chat", "System")
        
        while True:
            # Wait for message
            data = await websocket.receive_text()
            # Broadcast message
            await manager.broadcast(data, client_id)
            
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast(f"{client_id} left the chat", "System")