from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError # <--- NEW IMPORT
from app.core.config import settings # <--- NEW IMPORT
from app.db.session import engine, Base
from app.websockets.manager import manager
from app.api import auth 

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["Authentication"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Charla API"}

# --- 🔒 NEW SECURE WEBSOCKET ENDPOINT ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # 1. Get Token from Query Param (ws://.../ws?token=XYZ)
    token = websocket.query_params.get("token")
    
    if not token:
        await websocket.close(code=1008) # Policy Violation
        return

    try:
        # 2. Decode the Token to find the Username
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            await websocket.close(code=1008)
            return
            
    except JWTError:
        # Invalid Token (Fake or Expired)
        await websocket.close(code=1008)
        return

    # 3. Connection Accepted!
    await manager.connect(websocket, username)
    try:
        await manager.broadcast(f"{username} joined the chat", "System")
        while True:
            data = await websocket.receive_text()
            # Send message with REAL username (not spoofed)
            await manager.broadcast(data, username)
    except WebSocketDisconnect:
        manager.disconnect(username)
        await manager.broadcast(f"{username} left the chat", "System")