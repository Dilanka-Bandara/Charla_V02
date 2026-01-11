from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.db.models import Message, User

router = APIRouter()

# Schema for sending message data to frontend
class MessageResponse(BaseModel):
    content: str
    sender: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

@router.get("/messages", response_model=List[MessageResponse])
def get_messages(limit: int = 50, db: Session = Depends(get_db)):
    """Fetch the last 'limit' messages from the database."""
    messages = db.query(Message).order_by(Message.timestamp.asc()).limit(limit).all()
    
    # We need to map the 'sender' relationship to a username string
    results = []
    for msg in messages:
        results.append({
            "content": msg.content,
            "sender": msg.sender.username, # Get username from the relationship
            "timestamp": msg.timestamp
        })
    
    return results