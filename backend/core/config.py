import os
from dotenv import load_dotenv

# Load .env from the root directory
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(root_dir, ".env"))

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Souk Digital AI Studio"
    
    # SQLite Configuration
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./souk_ai.db"
    
    # Storage Configuration (Local Folder)
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    
    # AI Services
    FAL_KEY: str = os.getenv("FAL_KEY", "")

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
