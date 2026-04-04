import numpy as np
from dataclasses import dataclass


@dataclass
class PortfolioMetrics:
    weighted_entropy: float
    entropy_dispersion: float
    most_efficient_ticker: str
    least_efficient_ticker: str
    avg_liquidity_score: float
    correlation_matrix: list[list[float]]
    ticker_entropy_map: dict[str, float]
    dominant_regime: str


class PortfolioAggregator:
    def __init__(self, tickers: list[str], weights: list[float]):
        self.tickers = tickers
        self.weights = weights

    def compute_weighted_entropy(
        self, ticker_entropies: dict[str, float]
    ) -> float:
        total = 0.0
        for t, w in zip(self.tickers, self.weights):
            total += w * ticker_entropies.get(t, 0.0)
        return float(total)

    def compute_return_correlations(
        self, ticker_returns: dict[str, np.ndarray]
    ) -> np.ndarray:
        n = len(self.tickers)
        min_len = min(len(ticker_returns.get(t, [])) for t in self.tickers)
        min_len = max(min_len, 2)

        matrix = np.zeros((n, n))
        for i, ti in enumerate(self.tickers):
            for j, tj in enumerate(self.tickers):
                ri = ticker_returns.get(ti, np.zeros(min_len))[:min_len]
                rj = ticker_returns.get(tj, np.zeros(min_len))[:min_len]
                if len(ri) >= 2 and len(rj) >= 2:
                    corr = np.corrcoef(ri, rj)[0, 1]
                    matrix[i, j] = 0.0 if np.isnan(corr) else float(corr)
                else:
                    matrix[i, j] = 1.0 if i == j else 0.0
        return matrix

    def compute_entropy_heatmap_data(
        self,
        ticker_rolling_entropies: dict[str, np.ndarray],
        dates_per_ticker: dict[str, list[str]],
    ) -> list[dict]:
        """
        Returns flat list of {date, ticker, value} for the heatmap.
        Uses every 5th date to avoid overcrowding.
        """
        rows = []
        for ticker in self.tickers:
            entropy_arr = ticker_rolling_entropies.get(ticker, np.array([]))
            dates = dates_per_ticker.get(ticker, [])
            n = min(len(entropy_arr), len(dates))
            step = max(1, n // 60)  # at most 60 columns
            for i in range(0, n, step):
                rows.append({
                    "date": dates[i],
                    "ticker": ticker,
                    "value": round(float(entropy_arr[i]), 4),
                })
        return rows

    def compute_portfolio_entropy_surface(
        self,
        ticker_rolling_entropies: dict[str, np.ndarray],
        dates_per_ticker: dict[str, list[str]],
    ) -> dict:
        """
        Returns a dict matching PortfolioEntropySurface schema.
        Intersects dates across all tickers so the z_matrix is rectangular.
        """
        date_sets = [set(dates_per_ticker[t]) for t in self.tickers if t in dates_per_ticker]
        if not date_sets:
            return {"dates": [], "tickers": self.tickers, "weights": self.weights, "z_matrix": []}
        common_dates = sorted(date_sets[0].intersection(*date_sets[1:]))

        z_matrix = []
        for t in self.tickers:
            date_to_entropy = dict(zip(dates_per_ticker[t], ticker_rolling_entropies[t].tolist()))
            row = [round(date_to_entropy.get(d, float("nan")), 4) for d in common_dates]
            z_matrix.append(row)

        return {
            "dates": common_dates,
            "tickers": self.tickers,
            "weights": self.weights,
            "z_matrix": z_matrix,
        }

    def aggregate_portfolio_metrics(
        self,
        ticker_results: dict,
    ) -> PortfolioMetrics:
        """
        ticker_results: {ticker: {entropy_normalized, liquidity_score, returns, rolling_entropy_norm, rolling_dates}}
        """
        ticker_entropies = {
            t: v["entropy_normalized"] for t, v in ticker_results.items()
        }
        ticker_liquidity = {
            t: v["liquidity_score"] for t, v in ticker_results.items()
        }
        ticker_returns = {
            t: v["returns"] for t, v in ticker_results.items()
        }
        rolling_entropies = {
            t: v["rolling_entropy_norm"] for t, v in ticker_results.items()
        }
        rolling_dates = {
            t: v["rolling_dates"] for t, v in ticker_results.items()
        }

        weighted_entropy = self.compute_weighted_entropy(ticker_entropies)
        corr_matrix = self.compute_return_correlations(ticker_returns)
        heatmap_data = self.compute_entropy_heatmap_data(rolling_entropies, rolling_dates)

        entropies = list(ticker_entropies.values())
        dispersion = float(np.std(entropies)) if len(entropies) > 1 else 0.0

        most_efficient = min(ticker_entropies, key=ticker_entropies.get)
        least_efficient = max(ticker_entropies, key=ticker_entropies.get)

        avg_liquidity = float(np.mean(list(ticker_liquidity.values()))) if ticker_liquidity else 0.0

        # Dominant regime: from weighted entropy (matches regime.py thresholds: 0.50, 0.70)
        if weighted_entropy < 0.50:
            dominant = "low"
        elif weighted_entropy < 0.70:
            dominant = "medium"
        else:
            dominant = "high"

        return PortfolioMetrics(
            weighted_entropy=round(weighted_entropy, 4),
            entropy_dispersion=round(dispersion, 4),
            most_efficient_ticker=most_efficient,
            least_efficient_ticker=least_efficient,
            avg_liquidity_score=round(avg_liquidity, 4),
            correlation_matrix=corr_matrix.tolist(),
            ticker_entropy_map={t: round(e, 4) for t, e in ticker_entropies.items()},
            dominant_regime=dominant,
        )
