import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_path = str(Path(__file__).parent.parent / "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Set up environment
os.environ.setdefault("PYTHONPATH", backend_path)

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from api.routes import analysis, health, tickers
except ImportError as e:
    # Debug import issues
    raise ImportError(f"Failed to import: {e}. sys.path: {sys.path}")

# Create FastAPI app
app = FastAPI(
    title="Market Microstructure API",
    version="1.0.0",
    description="Entropy-driven market microstructure analysis",
)

# Add CORS middleware
# NOTE: Update allowed_origins with your specific production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        # Production: Replace with your actual Vercel domain
        # "https://your-project.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
    expose_headers=["Content-Type"],
    max_age=600,
)

# Include routers
app.include_router(health.router)
app.include_router(analysis.router)
app.include_router(tickers.router)

# Vercel expects 'app' to be exported for ASGI
# The name 'app' is the standard for serverless Python frameworks
