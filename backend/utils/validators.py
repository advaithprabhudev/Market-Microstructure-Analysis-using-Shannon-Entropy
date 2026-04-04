import re
from typing import Optional


TICKER_PATTERN = re.compile(r"^[A-Z0-9\.\-\^]{1,10}$")


def validate_ticker_symbol(ticker: str) -> bool:
    return bool(TICKER_PATTERN.match(ticker.upper().strip()))


def normalize_weights(weights: list[Optional[float]], n: int) -> list[float]:
    """
    Given a list of optional weights (may contain None), return normalized
    float weights that sum to 1.0.
    """
    filled = [w if w is not None else 0.0 for w in weights]
    total = sum(filled)
    if total == 0:
        return [1.0 / n] * n
    return [w / total for w in filled]
