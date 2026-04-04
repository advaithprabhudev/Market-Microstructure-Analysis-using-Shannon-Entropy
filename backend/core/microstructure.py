import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from scipy import stats
from core.entropy import EntropyCalculator
from utils.math_helpers import log_returns, safe_divide


@dataclass
class SpreadAnalysis:
    spread_abs_mean: float
    spread_bps_mean: float
    spread_bps_median: float
    spread_bps_std: float
    spread_skewness: float
    spread_entropy: float
    spread_entropy_normalized: float
    spread_series_bps: list[float]
    spread_entropy_rolling: list[float]


@dataclass
class OrderFlowAnalysis:
    buy_pressure_series: list[float]
    sell_pressure_series: list[float]
    net_flow_series: list[float]
    toxicity_score: float
    avg_trade_imbalance: float


@dataclass
class LiquidityMetrics:
    amihud_illiquidity: float
    kyle_lambda_proxy: float
    turnover_ratio: float
    roll_spread_estimate: float
    liquidity_score: float


@dataclass
class PriceDiscovery:
    efficiency_ratio: float
    autocorrelation_lag1: float
    variance_ratio: float
    is_efficient: bool


class MicrostructureAnalyzer:
    def __init__(self, entropy_bins: int = 10, rolling_window: int = 30, method: str = "uniform"):
        self.entropy_calc = EntropyCalculator(n_bins=entropy_bins, method=method)
        self.rolling_window = rolling_window

    def analyze_spread(
        self, bids: np.ndarray, asks: np.ndarray
    ) -> SpreadAnalysis:
        mid = (bids + asks) / 2.0
        spread_abs = asks - bids
        spread_bps = (spread_abs / mid) * 10_000.0

        result = self.entropy_calc.shannon_entropy(spread_bps)
        _, rolling_norm = self.entropy_calc.rolling_entropy(
            spread_bps, window_size=min(self.rolling_window, len(spread_bps) // 2)
        )

        skew = float(stats.skew(spread_bps)) if len(spread_bps) > 3 else 0.0

        return SpreadAnalysis(
            spread_abs_mean=float(np.mean(spread_abs)),
            spread_bps_mean=float(np.mean(spread_bps)),
            spread_bps_median=float(np.median(spread_bps)),
            spread_bps_std=float(np.std(spread_bps)),
            spread_skewness=skew,
            spread_entropy=result.entropy,
            spread_entropy_normalized=result.normalized_entropy,
            spread_series_bps=spread_bps.tolist(),
            spread_entropy_rolling=rolling_norm.tolist(),
        )

    def analyze_order_flow(
        self,
        close: np.ndarray,
        volume: np.ndarray,
        window: int = 20,
    ) -> OrderFlowAnalysis:
        # Tick rule: direction = sign(price change)
        direction = np.sign(np.diff(close))
        direction = np.where(direction == 0, 1, direction)  # treat flat as buy

        signed_vol = direction * volume[1:]
        total_vol = volume[1:]

        # Rolling buy/sell pressure
        w = min(window, len(signed_vol))
        buy_pressure = []
        sell_pressure = []
        net_flow = []

        for i in range(len(signed_vol) - w + 1):
            seg_signed = signed_vol[i : i + w]
            seg_total = total_vol[i : i + w]
            total = seg_total.sum()
            buy_vol = seg_signed[seg_signed > 0].sum()
            sell_vol = abs(seg_signed[seg_signed < 0].sum())
            buy_p = safe_divide(buy_vol, total)
            sell_p = safe_divide(sell_vol, total)
            buy_pressure.append(buy_p)
            sell_pressure.append(sell_p)
            net_flow.append(buy_p - sell_p)

        # VPIN toxicity proxy: correlation between order imbalance and next-period return
        ret = log_returns(close)
        imbalance = signed_vol / np.where(total_vol > 0, total_vol, 1.0)
        min_len = min(len(imbalance) - 1, len(ret) - 1)
        toxicity = 0.0
        if min_len > 5:
            tox_corr = np.corrcoef(imbalance[:min_len], ret[1 : min_len + 1])
            toxicity = float(tox_corr[0, 1]) if not np.isnan(tox_corr[0, 1]) else 0.0

        return OrderFlowAnalysis(
            buy_pressure_series=buy_pressure,
            sell_pressure_series=sell_pressure,
            net_flow_series=net_flow,
            toxicity_score=toxicity,
            avg_trade_imbalance=float(np.mean(np.abs(net_flow))) if net_flow else 0.0,
        )

    def compute_liquidity_metrics(
        self,
        close: np.ndarray,
        high: np.ndarray,
        low: np.ndarray,
        volume: np.ndarray,
    ) -> LiquidityMetrics:
        ret = log_returns(close)
        vol = volume[1:]
        vol_safe = np.where(vol > 0, vol, 1.0)

        # Amihud (2002) illiquidity ratio
        amihud = float(np.mean(np.abs(ret) / vol_safe) * 1e6)

        # Roll (1984) implicit spread
        delta_p = np.diff(close)
        if len(delta_p) >= 2:
            cov = np.cov(delta_p[:-1], delta_p[1:])[0, 1]
            roll_spread = float(2.0 * np.sqrt(max(-cov, 0.0)))
        else:
            roll_spread = 0.0

        # Kyle lambda: OLS of price_change ~ signed_volume
        signed_vol = np.sign(np.diff(close)) * vol
        if len(signed_vol) >= 10:
            slope, _, _, _, _ = stats.linregress(signed_vol, delta_p)
            kyle_lambda = float(abs(slope))
        else:
            kyle_lambda = 0.0

        # Turnover ratio: mean(volume / close)
        turnover = float(np.mean(volume / np.where(close > 0, close, 1.0)))

        # Composite liquidity score [0, 1] — higher is more liquid
        # Normalize each metric and invert illiquidity measures
        amihud_norm = 1.0 / (1.0 + amihud)
        roll_norm = 1.0 / (1.0 + roll_spread / (np.mean(close) + 1e-10) * 10_000.0)
        kyle_norm = 1.0 / (1.0 + kyle_lambda * 1e6)
        score = float((amihud_norm + roll_norm + kyle_norm) / 3.0)

        return LiquidityMetrics(
            amihud_illiquidity=amihud,
            kyle_lambda_proxy=kyle_lambda,
            turnover_ratio=turnover,
            roll_spread_estimate=roll_spread,
            liquidity_score=score,
        )

    def assess_price_discovery(self, close: np.ndarray) -> PriceDiscovery:
        ret = log_returns(close)

        # Efficiency ratio: |net displacement| / sum(|moves|)
        net = abs(close[-1] - close[0])
        total_path = np.sum(np.abs(np.diff(close)))
        efficiency_ratio = float(safe_divide(net, total_path))

        # Lag-1 autocorrelation
        if len(ret) > 2:
            autocorr = float(np.corrcoef(ret[:-1], ret[1:])[0, 1])
            autocorr = 0.0 if np.isnan(autocorr) else autocorr
        else:
            autocorr = 0.0

        # Variance ratio (2-period vs 1-period)
        if len(ret) >= 4:
            ret2 = log_returns(close[::2])  # every 2nd observation
            var1 = float(np.var(ret))
            var2 = float(np.var(ret2))
            vr = safe_divide(var2, 2.0 * var1, default=1.0)
        else:
            vr = 1.0

        return PriceDiscovery(
            efficiency_ratio=efficiency_ratio,
            autocorrelation_lag1=autocorr,
            variance_ratio=vr,
            is_efficient=abs(autocorr) < 0.1,
        )

    def build_rolling_metrics_timeseries(
        self,
        df: pd.DataFrame,
        bids: np.ndarray,
        asks: np.ndarray,
        entropy_norm_series: np.ndarray,
        regime_labels: list[str],
        dates: list[str],
    ) -> dict:
        """
        Assemble all rolling metrics aligned by date index.
        Returns a dict of aligned lists ready for JSON serialization.
        """
        n = len(dates)

        spread_bps = (asks - bids) / ((bids + asks) / 2.0) * 10_000.0

        return {
            "dates": dates,
            "entropy_norm": entropy_norm_series.tolist(),
            "regimes": regime_labels,
            "spread_bps": spread_bps.tolist() if len(spread_bps) == n else [0.0] * n,
        }
