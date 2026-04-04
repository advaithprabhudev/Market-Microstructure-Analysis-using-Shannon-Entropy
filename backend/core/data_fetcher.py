import yfinance as yf
import numpy as np
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional


class YFinanceFetcher:
    def __init__(self, period: str = "6mo", interval: str = "1d"):
        self.period = period
        self.interval = interval

    def fetch_ticker(self, ticker: str) -> pd.DataFrame:
        """
        Fetch OHLCV history for a ticker.
        Raises ValueError on invalid ticker or insufficient data.
        """
        t = yf.Ticker(ticker.upper())
        df = t.history(period=self.period, interval=self.interval, auto_adjust=True)

        if df.empty or len(df) < 20:
            raise ValueError(
                f"Insufficient data for {ticker} "
                f"(got {len(df)} rows, need at least 20)"
            )

        df.index = pd.to_datetime(df.index).tz_localize(None)
        df.columns = [c.lower() for c in df.columns]
        df = df[["open", "high", "low", "close", "volume"]].dropna()
        return df

    def fetch_portfolio(
        self, tickers: list[str]
    ) -> tuple[dict[str, pd.DataFrame], dict[str, str]]:
        """Fetch all tickers in parallel. Returns (results, errors)."""
        results: dict[str, pd.DataFrame] = {}
        errors: dict[str, str] = {}
        workers = min(len(tickers), 8)

        with ThreadPoolExecutor(max_workers=workers) as executor:
            future_to_ticker = {
                executor.submit(self.fetch_ticker, t): t for t in tickers
            }
            for future in as_completed(future_to_ticker):
                ticker = future_to_ticker[future]
                try:
                    results[ticker] = future.result()
                except Exception as exc:
                    errors[ticker] = str(exc)

        return results, errors

    def estimate_bid_ask(
        self, df: pd.DataFrame
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        Estimate bid/ask from OHLC since yfinance doesn't provide L1 quotes.
        bid = low + (close - low) * 0.4
        ask = high - (high - close) * 0.4
        """
        close = df["close"].values
        high = df["high"].values
        low = df["low"].values

        bids = low + (close - low) * 0.4
        asks = high - (high - close) * 0.4

        # Ensure ask > bid always
        mid = (bids + asks) / 2
        min_spread = mid * 0.0001  # 1 bps minimum
        spread = np.maximum(asks - bids, min_spread)
        bids = mid - spread / 2
        asks = mid + spread / 2

        return bids, asks

    def validate_ticker(self, ticker: str) -> dict:
        """Return metadata for ticker validation."""
        try:
            t = yf.Ticker(ticker.upper())
            info = t.info

            name = info.get("longName") or info.get("shortName") or ticker.upper()
            exchange = info.get("exchange", "Unknown")
            sector = info.get("sector", "Unknown")
            current_price = (
                info.get("currentPrice")
                or info.get("regularMarketPrice")
                or info.get("previousClose")
            )

            if current_price is None:
                # Try fetching a small amount of history
                df = t.history(period="5d", interval="1d")
                if df.empty:
                    return {"valid": False, "ticker": ticker.upper()}
                current_price = float(df["Close"].iloc[-1])

            return {
                "valid": True,
                "ticker": ticker.upper(),
                "name": name,
                "exchange": exchange,
                "sector": sector,
                "current_price": float(current_price),
            }
        except Exception as exc:
            return {"valid": False, "ticker": ticker.upper(), "error": str(exc)}
