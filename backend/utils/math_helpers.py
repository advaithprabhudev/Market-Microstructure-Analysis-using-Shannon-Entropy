import numpy as np
import pandas as pd
from typing import Optional


def log_returns(prices: np.ndarray) -> np.ndarray:
    """Compute log returns from a price series."""
    prices = np.asarray(prices, dtype=float)
    return np.log(prices[1:] / prices[:-1])


def discretize_data(
    data: np.ndarray,
    n_bins: int = 10,
    method: str = "quantile",
) -> tuple[np.ndarray, np.ndarray]:
    """
    Discretize continuous data into bins.

    Returns (bin_indices, bin_edges).
    """
    data = np.asarray(data, dtype=float)
    data = data[np.isfinite(data)]

    if method == "quantile":
        quantiles = np.linspace(0, 100, n_bins + 1)
        bin_edges = np.unique(np.percentile(data, quantiles))
    else:
        bin_edges = np.linspace(data.min(), data.max(), n_bins + 1)

    # Ensure at least 2 unique edges
    if len(bin_edges) < 2:
        bin_edges = np.array([data.min() - 1e-10, data.max() + 1e-10])

    bin_indices = np.digitize(data, bin_edges[:-1]) - 1
    bin_indices = np.clip(bin_indices, 0, len(bin_edges) - 2)
    return bin_indices, bin_edges


def rolling_window_view(data: np.ndarray, window: int) -> np.ndarray:
    """Return a 2-D strided view of data with the given window size."""
    if len(data) < window:
        return np.empty((0, window))
    shape = (len(data) - window + 1, window)
    strides = (data.strides[0], data.strides[0])
    return np.lib.stride_tricks.as_strided(data, shape=shape, strides=strides)


def safe_divide(a: float, b: float, default: float = 0.0) -> float:
    return a / b if b != 0 else default
