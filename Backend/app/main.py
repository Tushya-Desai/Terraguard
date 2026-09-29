import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .config import settings
from .database import init_db, get_db
from .routers import auth_router, tests_router, notifications_router, plots_router
from .seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database, tables, and uploads directory exist
    print("[TerraGuard Backend] Initializing database and storage...")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    try:
        init_db()
        # Seed default demo data on fresh setup
        seed_database()
    except Exception as e:
        print(f"[TerraGuard Backend Warning] Database startup notice: {e}")
    yield
    print("[TerraGuard Backend] Shutting down.")

app = FastAPI(
    title="TerraGuard Companion API",
    description="Software Companion Module for TerraGuard Soil Lead Detection & Remediation Tracking",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or [
        "https://terraguard-eosin.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory for reaction photo display (PRD 4.4)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(auth_router.router)
app.include_router(tests_router.router)
app.include_router(notifications_router.router)
app.include_router(plots_router.router)
app.include_router(plots_router.router, prefix="/api")

@app.get("/", tags=["Health"])
def root():
    return {
        "app": "TerraGuard Companion API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}

@app.post("/seed", tags=["Development"])
def trigger_seed(db: Session = Depends(get_db)):
    """Convenience endpoint to seed demo records."""
    seed_database(db)
    return {"message": "Database successfully seeded with demo user and tests."}
