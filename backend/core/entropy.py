import numpy as np
from dataclasses import dataclass
from utils.math_helpers import discretize_data, rolling_window_view, log_returns

REGIME_LOW_MAX = 0.50
REGIME_MED_MAX = 0.70


@dataclass
class EntropyResult:
    entropy: float
    normalized_entropy: float
    regime: str
    probability_distribution: list[float]
    bin_edges: list[float]
    sample_size: int


def _regime_from_normalized(v: float) -> str:
    if v < REGIME_LOW_MAX:  # < 0.50
        return "low"
    if v < REGIME_MED_MAX:  # < 0.70
        return "medium"
    return "high"


class EntropyCalculator:
    def __init__(self, n_bins: int = 10, method: str = "uniform"):
        self.n_bins = n_bins
        self.method = method

    def shannon_entropy(self, data: np.ndarray) -> EntropyResult:
        data = np.asarray(data, dtype=float)
        data = data[np.isfinite(data)]

        bin_indices, bin_edges = discretize_data(data, self.n_bins, self.method)
        counts = np.bincount(bin_indices, minlength=self.n_bins)
        probs = counts / counts.sum()

        eps = 1e-12
        h = -np.sum(probs[probs > eps] * np.log(probs[probs > eps]))
        h_max = np.log(self.n_bins)
        h_norm = float(h / h_max) if h_max > 0 else 0.0

        return EntropyResult(
            entropy=float(h),
            normalized_entropy=min(h_norm, 1.0),
            regime=_regime_from_normalized(h_norm),
            probability_distribution=probs.tolist(),
            bin_edges=bin_edges.tolist(),
            sample_size=len(data),
        )

    def rolling_entropy(
        self,
        data: np.ndarray,
        window_size: int = 30,
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        Returns (raw_entropy_series, normalized_entropy_series).
        Output length = len(data) - window_size + 1.
        Uses GLOBAL bin edges (computed from entire series) for all windows.
        This preserves entropy signal across windows.
        """
        data = np.asarray(data, dtype=float)
        windows = rolling_window_view(data, window_size)
        h_max = np.log(self.n_bins)

        # Compute global bin edges from the entire data series once
        clean_data = data[np.isfinite(data)]
        if len(clean_data) < 2:
            return np.array([0.0] * len(windows)), np.array([0.0] * len(windows))
        _, global_edges = discretize_data(clean_data, self.n_bins, self.method)

        raw_list = []
        norm_list = []
        for w in windows:
            w = w[np.isfinite(w)]
            if len(w) < 2:
                raw_list.append(0.0)
                norm_list.append(0.0)
                continue
            # Use global bin edges, not per-window quantiles
            bin_idx = np.digitize(w, global_edges[:-1]) - 1
            bin_idx = np.clip(bin_idx, 0, len(global_edges) - 2)
            counts = np.bincount(bin_idx, minlength=self.n_bins)
            probs = counts / counts.sum()
            eps = 1e-12
            h = -np.sum(probs[probs > eps] * np.log(probs[probs > eps]))
            h_norm = float(h / h_max) if h_max > 0 else 0.0
            raw_list.append(float(h))
            norm_list.append(min(h_norm, 1.0))

        return np.array(raw_list), np.array(norm_list)

    def rolling_entropy_regimes(
        self, normalized_entropy_series: np.ndarray
    ) -> list[str]:
        return [_regime_from_normalized(v) for v in normalized_entropy_series]

    def renyi_entropy(self, data: np.ndarray, alpha: float = 2.0) -> float:
        data = np.asarray(data, dtype=float)
        data = data[np.isfinite(data)]
        bin_idx, _ = discretize_data(data, self.n_bins, self.method)
        counts = np.bincount(bin_idx, minlength=self.n_bins)
        probs = counts / counts.sum()
        eps = 1e-12
        probs = probs[probs > eps]
        if alpha == 1.0:
            return float(-np.sum(probs * np.log(probs)))
        return float(np.log(np.sum(probs**alpha)) / (1.0 - alpha))

    def multiscale_entropy(
        self,
        data: np.ndarray,
        scales: list[int] = [10, 20, 30, 60],
    ) -> dict[int, np.ndarray]:
        results = {}
        for scale in scales:
            _, norm = self.rolling_entropy(data, window_size=scale)
            results[scale] = norm
        return results

    def build_multiscale_surface(
        self,
        data: np.ndarray,
        scales: list[int],
        reference_dates: list[str],
    ) -> tuple[list[str], list[int], list[list[float]]]:
        """
        Returns (common_dates, valid_scales, z_matrix).
        All scale series are right-aligned to the shortest (most restrictive) series.
        Scales that produce empty output due to insufficient data are dropped.
        """
        ms = self.multiscale_entropy(data, scales)
        valid = {s: arr for s, arr in ms.items() if len(arr) > 0}
        if not valid:
            return [], [], []

        n_common = min(len(arr) for arr in valid.values())
        common_dates = reference_dates[-n_common:]

        z_matrix = []
        for scale in sorted(valid.keys()):
            arr = valid[scale]
            aligned = arr[-n_common:]  # right-align to most recent n_common dates
            z_matrix.append([round(float(v), 4) for v in aligned])

        return common_dates, sorted(valid.keys()), z_matrix
