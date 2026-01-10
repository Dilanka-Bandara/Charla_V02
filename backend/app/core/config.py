import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Charla"
    PROJECT_VERSION: str = "1.0.0"
    
    # Database (Defaults to a local SQLite file for simplicity)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./charla.db")
    
    # Security (We will use these later for Login)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_key_change_this_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings()