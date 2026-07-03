from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.core.config import settings

app = FastAPI(
    title="Souk Digital AI Studio API",
    description="API for Souk Digital's AI features including Image Generation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded generated images locally
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to Souk Digital AI Studio API"}

from backend.api.router import router as api_router
app.include_router(api_router, prefix="/api", tags=["generation"])
