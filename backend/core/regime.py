import numpy as np
from dataclasses import dataclass
from itertools import groupby


REGIME_THRESHOLDS = {"low": (0.0, 0.50), "medium": (0.50, 0.70), "high": (0.70, 1.01)}

REGIME_NUMERIC: dict[str, float] = {"low": 0.2, "medium": 0.5, "high": 1.0}


def build_regime_surface(z_entropy_matrix: list[list[float]]) -> list[list[float]]:
    """Convert an entropy z_matrix to a regime-encoded numeric z_matrix.
    Values: low=0.2, medium=0.5, high=1.0 — chosen for visual separation on Plotly surfaces.
    """
    def _encode(v: float) -> float:
        if v < 0.50:
            return 0.2
        if v < 0.70:
            return 0.5
        return 1.0

    return [[_encode(v) for v in row] for row in z_entropy_matrix]


@dataclass
class RegimePeriod:
    start_date: str
    end_date: str
    regime: str
    avg_entropy: float
    duration_days: int


def classify_single(normalized_entropy: float) -> str:
    if normalized_entropy < 0.50:
        return "low"
    if normalized_entropy < 0.70:
        return "medium"
    return "high"


class RegimeClassifier:
    def classify_series(self, normalized_entropy_series: np.ndarray) -> list[str]:
        return [classify_single(v) for v in normalized_entropy_series]

    def extract_regime_periods(
        self,
        dates: list[str],
        regime_labels: list[str],
        entropy_series: np.ndarray,
    ) -> list[RegimePeriod]:
        periods = []
        idx = 0
        for regime, group in groupby(regime_labels):
            count = sum(1 for _ in group)
            start_i = idx
            end_i = idx + count - 1
            segment_entropy = entropy_series[start_i : end_i + 1]
            periods.append(
                RegimePeriod(
                    start_date=dates[start_i],
                    end_date=dates[end_i],
                    regime=regime,
                    avg_entropy=float(np.mean(segment_entropy)),
                    duration_days=count,
                )
            )
            idx += count
        return periods

    def compute_regime_statistics(
        self,
        regime_labels: list[str],
        entropy_series: np.ndarray,
    ) -> dict:
        n = len(regime_labels)
        stats = {}
        for r in ["low", "medium", "high"]:
            mask = [i for i, lbl in enumerate(regime_labels) if lbl == r]
            count = len(mask)
            pct = count / n if n > 0 else 0.0
            avg_entropy = (
                float(np.mean(entropy_series[mask])) if mask else 0.0
            )
            stats[r] = {
                "count": count,
                "pct": round(pct, 4),
                "avg_entropy": round(avg_entropy, 4),
            }

        # Count transitions
        transitions = sum(
            1 for i in range(1, len(regime_labels))
            if regime_labels[i] != regime_labels[i - 1]
        )
        stats["transitions"] = transitions
        return stats
