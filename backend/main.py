from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import analysis, health, tickers

app = FastAPI(
    title="Market Microstructure API",
    version="1.0.0",
    description="Entropy-driven market microstructure analysis",
)

# Add CORS middleware BEFORE including routers
# Middleware is processed in reverse order, so CORS must be added first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "localhost"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Include routers AFTER middleware setup
app.include_router(health.router)
app.include_router(analysis.router)
app.include_router(tickers.router)
