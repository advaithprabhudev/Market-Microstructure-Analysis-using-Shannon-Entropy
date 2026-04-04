from pydantic import BaseModel
from typing import Optional


class MultiscaleEntropySurface(BaseModel):
    dates: list[str]             # common date axis (length n_common)
    scales: list[int]            # e.g., [10, 20, 30, 60]
    z_matrix: list[list[float]]  # shape: len(scales) × n_common


class RegimeDetectionSurface(BaseModel):
    dates: list[str]
    scales: list[int]
    z_matrix: list[list[float]]  # values: 0.2 (low) | 0.5 (medium) | 1.0 (high)


class PortfolioEntropySurface(BaseModel):
    dates: list[str]             # intersection of all ticker date axes
    tickers: list[str]           # y-axis
    weights: list[float]         # metadata
    z_matrix: list[list[float]]  # shape: len(tickers) × len(dates)


class RollingEntropyData(BaseModel):
    dates: list[str]
    entropy: list[float]
    normalized_entropy: list[float]
    regimes: list[str]


class SpreadData(BaseModel):
    dates: list[str]
    spread_bps: list[float]
    spread_entropy_rolling: list[float]
    stats: dict


class OrderFlowData(BaseModel):
    dates: list[str]
    buy_pressure: list[float]
    sell_pressure: list[float]
    net_flow: list[float]
    toxicity_score: float


class RegimePeriodOut(BaseModel):
    start_date: str
    end_date: str
    regime: str
    avg_entropy: float
    duration_days: int


class TickerAnalysis(BaseModel):
    ticker: str
    name: str
    current_price: float
    data_points: int
    entropy_current: float
    entropy_normalized: float
    regime_current: str
    rolling_entropy: RollingEntropyData
    spread: SpreadData
    order_flow: OrderFlowData
    liquidity: dict
    price_discovery: dict
    regime_periods: list[RegimePeriodOut]
    regime_stats: dict
    multiscale_surface: Optional[MultiscaleEntropySurface] = None
    regime_surface: Optional[RegimeDetectionSurface] = None


class PortfolioSummary(BaseModel):
    tickers: list[str]
    weights: list[float]
    weighted_entropy: float
    dominant_regime: str
    most_efficient_ticker: str
    least_efficient_ticker: str
    avg_liquidity_score: float
    entropy_dispersion: float
    correlation_matrix: list[list[float]]
    ticker_entropy_map: dict[str, float]
    heatmap_data: list[dict]
    portfolio_entropy_surface: Optional[PortfolioEntropySurface] = None


class PortfolioAnalysisResponse(BaseModel):
    status: str
    computation_time_ms: float
    tickers_requested: list[str]
    tickers_succeeded: list[str]
    tickers_failed: dict[str, str]
    config: dict
    portfolio: PortfolioSummary
    ticker_analyses: list[TickerAnalysis]
