import time
import numpy as np
from fastapi import APIRouter, HTTPException
from api.schemas.request import PortfolioRequest
from api.schemas.response import (
    PortfolioAnalysisResponse,
    PortfolioSummary,
    TickerAnalysis,
    RollingEntropyData,
    SpreadData,
    OrderFlowData,
    RegimePeriodOut,
    MultiscaleEntropySurface,
    RegimeDetectionSurface,
    PortfolioEntropySurface,
)
from core.data_fetcher import YFinanceFetcher
from core.entropy import EntropyCalculator
from core.microstructure import MicrostructureAnalyzer
from core.regime import RegimeClassifier, build_regime_surface

DEFAULT_3D_SCALES = [10, 20, 30, 60]
from core.portfolio import PortfolioAggregator
from utils.math_helpers import log_returns

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _analyze_ticker(
    ticker: str,
    ticker_name: str,
    current_price: float,
    df,
    config,
) -> dict:
    """Run full microstructure analysis for a single ticker. Returns raw dict."""

    close = df["close"].values
    high = df["high"].values
    low = df["low"].values
    volume = df["volume"].values
    dates_raw = df.index.tolist()
    dates_str = [str(d)[:10] for d in dates_raw]

    fetcher = YFinanceFetcher(period=config.period)
    entropy_calc = EntropyCalculator(n_bins=config.entropy_bins, method=config.entropy_method)
    micro = MicrostructureAnalyzer(entropy_bins=config.entropy_bins, rolling_window=config.rolling_window, method=config.entropy_method)
    regime_clf = RegimeClassifier()

    bids, asks = fetcher.estimate_bid_ask(df)
    ret = log_returns(close)

    # Point-in-time entropy on returns
    entropy_result = entropy_calc.shannon_entropy(ret)

    # Rolling entropy (on returns, padded to align with dates)
    raw_ent, norm_ent = entropy_calc.rolling_entropy(ret, window_size=config.rolling_window)

    # Align rolling entropy dates: rolling window shrinks by (window-1) from the left
    offset = len(dates_str) - len(norm_ent)
    rolling_dates = dates_str[offset:]
    rolling_regime_labels = regime_clf.classify_series(norm_ent)

    # 3D Multiscale entropy surface
    ms_dates, ms_scales, ms_z = entropy_calc.build_multiscale_surface(
        ret, DEFAULT_3D_SCALES, rolling_dates
    )
    regime_z = build_regime_surface(ms_z) if ms_z else []

    # Spread
    spread = micro.analyze_spread(bids, asks)
    spread_dates = dates_str  # spread is per day

    # Align spread entropy rolling to dates
    spread_entropy_rolling = spread.spread_entropy_rolling
    # rolling entropy of spread is shorter by rolling_window - 1
    spread_offset = len(spread_dates) - len(spread_entropy_rolling)
    spread_rolling_dates = spread_dates[spread_offset:]

    # Order flow
    order_flow = micro.analyze_order_flow(close, volume, window=20)
    of_offset = len(dates_str) - len(order_flow.buy_pressure_series) - 1
    of_dates = dates_str[max(of_offset, 0): max(of_offset, 0) + len(order_flow.buy_pressure_series)]

    # Liquidity
    liquidity = micro.compute_liquidity_metrics(close, high, low, volume)

    # Price discovery
    price_disc = micro.assess_price_discovery(close)

    # Regime periods
    regime_periods = regime_clf.extract_regime_periods(
        rolling_dates, rolling_regime_labels, norm_ent
    )
    regime_stats = regime_clf.compute_regime_statistics(rolling_regime_labels, norm_ent)

    return {
        "ticker": ticker,
        "name": ticker_name,
        "current_price": current_price,
        "data_points": len(close),
        "entropy_current": entropy_result.entropy,
        "entropy_normalized": entropy_result.normalized_entropy,
        "regime_current": entropy_result.regime,
        "rolling_entropy": {
            "dates": rolling_dates,
            "entropy": raw_ent.tolist(),
            "normalized_entropy": norm_ent.tolist(),
            "regimes": rolling_regime_labels,
        },
        "spread": {
            "dates": spread_dates,
            "spread_bps": spread.spread_series_bps,
            "spread_entropy_rolling": spread_entropy_rolling,
            "spread_rolling_dates": spread_rolling_dates,
            "stats": {
                "mean_bps": round(spread.spread_bps_mean, 4),
                "median_bps": round(spread.spread_bps_median, 4),
                "std_bps": round(spread.spread_bps_std, 4),
                "skewness": round(spread.spread_skewness, 4),
                "entropy": round(spread.spread_entropy, 4),
                "entropy_normalized": round(spread.spread_entropy_normalized, 4),
            },
        },
        "order_flow": {
            "dates": of_dates,
            "buy_pressure": order_flow.buy_pressure_series,
            "sell_pressure": order_flow.sell_pressure_series,
            "net_flow": order_flow.net_flow_series,
            "toxicity_score": round(order_flow.toxicity_score, 4),
        },
        "liquidity": {
            "amihud_illiquidity": round(liquidity.amihud_illiquidity, 6),
            "kyle_lambda_proxy": round(liquidity.kyle_lambda_proxy, 8),
            "turnover_ratio": round(liquidity.turnover_ratio, 4),
            "roll_spread_estimate": round(liquidity.roll_spread_estimate, 4),
            "liquidity_score": round(liquidity.liquidity_score, 4),
        },
        "price_discovery": {
            "efficiency_ratio": round(price_disc.efficiency_ratio, 4),
            "autocorrelation_lag1": round(price_disc.autocorrelation_lag1, 4),
            "variance_ratio": round(price_disc.variance_ratio, 4),
            "is_efficient": price_disc.is_efficient,
        },
        "regime_periods": [
            {
                "start_date": p.start_date,
                "end_date": p.end_date,
                "regime": p.regime,
                "avg_entropy": round(p.avg_entropy, 4),
                "duration_days": p.duration_days,
            }
            for p in regime_periods
        ],
        "regime_stats": regime_stats,
        # 3D surface data
        "multiscale_surface": {
            "dates": ms_dates,
            "scales": ms_scales,
            "z_matrix": ms_z,
        },
        "regime_surface_z": regime_z,
        # For portfolio aggregation
        "returns": ret,
        "rolling_entropy_norm": norm_ent,
        "rolling_dates": rolling_dates,
        "liquidity_score": liquidity.liquidity_score,
    }


@router.post("/portfolio", response_model=PortfolioAnalysisResponse)
async def analyze_portfolio(request: PortfolioRequest):
    try:
        start_time = time.perf_counter()

        tickers = [tw.ticker for tw in request.tickers]
        weights = [tw.weight for tw in request.tickers]
        config = request.config

        print(f"[DEBUG] Analyzing tickers: {tickers}")

        # Fetch market data
        fetcher = YFinanceFetcher(period=config.period)
        data_map, fetch_errors = fetcher.fetch_portfolio(tickers)

        print(f"[DEBUG] Fetched data for: {list(data_map.keys())}, Errors: {fetch_errors}")

        if not data_map:
            raise HTTPException(
                status_code=500,
                detail=f"All tickers failed to fetch: {fetch_errors}",
            )

        # Per-ticker analysis
        ticker_results_raw = {}
        analysis_errors = dict(fetch_errors)

        for ticker in tickers:
            if ticker in fetch_errors:
                continue
            df = data_map[ticker]
            try:
                # Get metadata for name/price
                meta = fetcher.validate_ticker(ticker)
                name = meta.get("name", ticker)
                current_price = meta.get("current_price", float(df["close"].iloc[-1]))
                ticker_results_raw[ticker] = _analyze_ticker(
                    ticker, name, current_price, df, config
                )
            except Exception as exc:
                analysis_errors[ticker] = str(exc)

        succeeded = list(ticker_results_raw.keys())
        if not succeeded:
            raise HTTPException(
                status_code=500,
                detail=f"Analysis failed for all tickers: {analysis_errors}",
            )

        # Reconstruct weights for only succeeded tickers (re-normalize)
        succeeded_weights = []
        for t in succeeded:
            idx = tickers.index(t)
            succeeded_weights.append(weights[idx])
        total_w = sum(succeeded_weights)
        succeeded_weights = [w / total_w for w in succeeded_weights]

        # Portfolio aggregation
        agg = PortfolioAggregator(tickers=succeeded, weights=succeeded_weights)
        portfolio_metrics = agg.aggregate_portfolio_metrics(ticker_results_raw)

        # Build response ticker_analyses
        ticker_analyses = []
        for ticker in succeeded:
            r = ticker_results_raw[ticker]
            # Align spread_entropy_rolling to spread dates using spread_rolling_dates
            spread_rolling_dates = r["spread"].get("spread_rolling_dates", r["spread"]["dates"])
            ticker_analyses.append(
                TickerAnalysis(
                    ticker=r["ticker"],
                    name=r["name"],
                    current_price=r["current_price"],
                    data_points=r["data_points"],
                    entropy_current=round(r["entropy_current"], 4),
                    entropy_normalized=round(r["entropy_normalized"], 4),
                    regime_current=r["regime_current"],
                    rolling_entropy=RollingEntropyData(
                        dates=r["rolling_entropy"]["dates"],
                        entropy=r["rolling_entropy"]["entropy"],
                        normalized_entropy=r["rolling_entropy"]["normalized_entropy"],
                        regimes=r["rolling_entropy"]["regimes"],
                    ),
                    spread=SpreadData(
                        dates=spread_rolling_dates,
                        spread_bps=r["spread"]["spread_bps"][
                            len(r["spread"]["spread_bps"]) - len(spread_rolling_dates):
                        ],
                        spread_entropy_rolling=r["spread"]["spread_entropy_rolling"],
                        stats=r["spread"]["stats"],
                    ),
                    order_flow=OrderFlowData(
                        dates=r["order_flow"]["dates"],
                        buy_pressure=r["order_flow"]["buy_pressure"],
                        sell_pressure=r["order_flow"]["sell_pressure"],
                        net_flow=r["order_flow"]["net_flow"],
                        toxicity_score=r["order_flow"]["toxicity_score"],
                    ),
                    liquidity=r["liquidity"],
                    price_discovery=r["price_discovery"],
                    regime_periods=[RegimePeriodOut(**p) for p in r["regime_periods"]],
                    regime_stats=r["regime_stats"],
                    multiscale_surface=MultiscaleEntropySurface(
                        **r["multiscale_surface"]
                    ) if r["multiscale_surface"]["dates"] else None,
                    regime_surface=RegimeDetectionSurface(
                        dates=r["multiscale_surface"]["dates"],
                        scales=r["multiscale_surface"]["scales"],
                        z_matrix=r["regime_surface_z"],
                    ) if r["multiscale_surface"]["dates"] else None,
                )
            )

        portfolio_summary = PortfolioSummary(
            tickers=succeeded,
            weights=succeeded_weights,
            weighted_entropy=portfolio_metrics.weighted_entropy,
            dominant_regime=portfolio_metrics.dominant_regime,
            most_efficient_ticker=portfolio_metrics.most_efficient_ticker,
            least_efficient_ticker=portfolio_metrics.least_efficient_ticker,
            avg_liquidity_score=portfolio_metrics.avg_liquidity_score,
            entropy_dispersion=portfolio_metrics.entropy_dispersion,
            correlation_matrix=portfolio_metrics.correlation_matrix,
            ticker_entropy_map=portfolio_metrics.ticker_entropy_map,
            heatmap_data=agg.compute_entropy_heatmap_data(
                {t: ticker_results_raw[t]["rolling_entropy_norm"] for t in succeeded},
                {t: ticker_results_raw[t]["rolling_dates"] for t in succeeded},
            ),
            portfolio_entropy_surface=PortfolioEntropySurface(
                **agg.compute_portfolio_entropy_surface(
                    {t: ticker_results_raw[t]["rolling_entropy_norm"] for t in succeeded},
                    {t: ticker_results_raw[t]["rolling_dates"] for t in succeeded},
                )
            ),
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        status = "success" if not analysis_errors else "partial"

        return PortfolioAnalysisResponse(
            status=status,
            computation_time_ms=round(elapsed_ms, 1),
            tickers_requested=tickers,
            tickers_succeeded=succeeded,
            tickers_failed=analysis_errors,
            config=config.model_dump(),
            portfolio=portfolio_summary,
            ticker_analyses=ticker_analyses,
        )

    except Exception as e:
        print(f"[ERROR] Analysis failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )
