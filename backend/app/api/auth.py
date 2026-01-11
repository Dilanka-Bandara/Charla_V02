from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate, UserLogin, Token

router = APIRouter()

# --- REGISTER ROUTE ---
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Check Username
    user_exists = db.query(User).filter(User.username == user.username).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # 2. Check Email (Safely)
    if user.email:
        email_exists = db.query(User).filter(User.email == user.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # 3. Create User
    hashed_pw = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully"}

# --- LOGIN ROUTE (This was likely missing!) ---
@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    # 1. Find User
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    # 2. Check Password
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    # 3. Generate Token
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}