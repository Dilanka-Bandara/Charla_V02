from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from sqlalchemy.orm import Session # <--- Needed for DB session

from app.core.config import settings
from app.db.session import engine, Base, get_db # <--- Import get_db
from app.db.models import User, Message # <--- Import Models
from app.websockets.manager import manager
from app.api import auth, chat # <--- Import chat

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(chat.router, tags=["Chat"]) # <--- Register the new History API

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    db: Session = Depends(get_db) # <--- Inject Database Session into WebSocket
):
    token = websocket.query_params.get("token")
    
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    # 1. Connect
    await manager.connect(websocket, username)
    
    # 2. Get the User Object (We need the ID to save messages)
    user = db.query(User).filter(User.username == username).first()
    
    try:
        await manager.broadcast(f"{username} joined the chat", "System")
        
        while True:
            data = await websocket.receive_text()
            
            # --- 💾 SAVE TO DATABASE ---
            new_msg = Message(content=data, sender_id=user.id)
            db.add(new_msg)
            db.commit()
            # ---------------------------

            await manager.broadcast(data, username)
            
    except WebSocketDisconnect:
        manager.disconnect(username)
        await manager.broadcast(f"{username} left the chat", "System")