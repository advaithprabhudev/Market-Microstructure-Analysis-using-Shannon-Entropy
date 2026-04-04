import sys
from pathlib import Path

# Add backend directory to Python path so imports work
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import analysis, health, tickers

# Create FastAPI app
app = FastAPI(
    title="Market Microstructure API",
    version="1.0.0",
    description="Entropy-driven market microstructure analysis",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://*.vercel.app",
        "https://*.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Include routers
app.include_router(health.router)
app.include_router(analysis.router)
app.include_router(tickers.router)


# Export the FastAPI app as a handler for Vercel
handler = app
