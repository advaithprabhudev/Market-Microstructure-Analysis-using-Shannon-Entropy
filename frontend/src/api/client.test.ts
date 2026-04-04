import { describe, it, expect } from "vitest";
import { healthCheck, validateTicker, analyzePortfolio } from "./client";

describe("Backend integration", () => {
  it("GET /api/health returns status ok", async () => {
    const result = await healthCheck();
    expect(result.status).toBe("ok");
  });

  it("GET /api/tickers/validate returns valid=true for AAPL", async () => {
    const result = await validateTicker("AAPL");
    expect(result.valid).toBe(true);
    expect(result.name).toBeTruthy();
    expect(result.current_price).toBeGreaterThan(0);
  });

  it("POST /api/analysis/portfolio returns analysis for AAPL", async () => {
    const result = await analyzePortfolio({
      tickers: [{ ticker: "AAPL", weight: 1.0 }],
      config: { period: "1mo" },
    });

    expect(result.status).toMatch(/success|partial/);
    expect(result.tickers_succeeded).toContain("AAPL");
    expect(result.ticker_analyses.length).toBeGreaterThan(0);

    const aapl = result.ticker_analyses[0];
    expect(aapl.ticker).toBe("AAPL");
    expect(aapl.entropy_normalized).toBeGreaterThanOrEqual(0);
    expect(aapl.entropy_normalized).toBeLessThanOrEqual(1);
    expect(aapl.regime_current).toMatch(/low|medium|high/);
    expect(aapl.rolling_entropy.dates.length).toBeGreaterThan(0);
    expect(aapl.spread.stats.mean_bps).toBeGreaterThanOrEqual(0);
  });
});
