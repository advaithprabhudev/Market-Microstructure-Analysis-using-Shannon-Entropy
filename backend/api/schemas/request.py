from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional


class TickerWeight(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)
    weight: Optional[float] = Field(None, ge=0.0, le=1.0)

    @field_validator("ticker")
    @classmethod
    def uppercase_ticker(cls, v: str) -> str:
        return v.upper().strip()


class AnalysisConfig(BaseModel):
    period: str = Field("6mo", pattern=r"^(1mo|3mo|6mo|1y|2y|5y)$")
    rolling_window: int = Field(30, ge=10, le=120)
    entropy_bins: int = Field(10, ge=5, le=30)
    entropy_method: str = Field("uniform", pattern=r"^(quantile|uniform)$")


class PortfolioRequest(BaseModel):
    tickers: list[TickerWeight] = Field(..., min_length=1, max_length=20)
    config: AnalysisConfig = Field(default_factory=AnalysisConfig)

    @model_validator(mode="after")
    def normalize_weights(self) -> "PortfolioRequest":
        weights = [t.weight for t in self.tickers]
        all_none = all(w is None for w in weights)

        if all_none:
            eq = 1.0 / len(self.tickers)
            for tw in self.tickers:
                tw.weight = eq
        else:
            total = sum(w for w in weights if w is not None)
            if total <= 0:
                eq = 1.0 / len(self.tickers)
                for tw in self.tickers:
                    tw.weight = eq
            else:
                for tw in self.tickers:
                    tw.weight = (tw.weight or 0.0) / total

        return self
