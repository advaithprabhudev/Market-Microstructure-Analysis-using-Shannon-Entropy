"""
FastAPI application wrapper for Vercel serverless environment.
Vercel's Python runtime expects ASGI apps to be named 'app'.
"""

import sys
import os
from pathlib import Path

# Configure Python path
PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Set environment variables
os.environ.setdefault("PYTHONPATH", str(BACKEND_DIR))

# Import FastAPI and components
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create the FastAPI application
app = FastAPI(
    title="Market Microstructure API",
    version="1.0.0",
    description="Entropy-driven market microstructure analysis",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
    expose_headers=["Content-Type"],
    max_age=600,
)


# Import and include routers
try:
    from api.routes import analysis, health, tickers

    app.include_router(health.router)
    app.include_router(analysis.router)
    app.include_router(tickers.router)
except Exception as e:
    # Log import errors but don't crash - Vercel will show the error
    import traceback
    error_msg = f"Failed to load routers: {str(e)}\n{traceback.format_exc()}"

    # Create a fallback error endpoint
    @app.get("/")
    async def root():
        return {"error": error_msg, "status": "import_failed"}


# Health check endpoint at root
@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {
        "status": "ok",
        "service": "Market Microstructure API",
    }


# Vercel exports - app is the ASGI application
# No need to export 'handler' separately, Vercel auto-detects 'app'
