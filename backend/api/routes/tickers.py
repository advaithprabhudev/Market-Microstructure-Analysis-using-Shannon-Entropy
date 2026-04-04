from fastapi import APIRouter
from core.data_fetcher import YFinanceFetcher

router = APIRouter(prefix="/api/tickers", tags=["tickers"])
_fetcher = YFinanceFetcher()


@router.get("/validate")
async def validate_ticker(symbol: str):
    return _fetcher.validate_ticker(symbol)
