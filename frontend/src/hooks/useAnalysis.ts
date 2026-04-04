import { useAnalysisStore } from "../store/analysisStore";
import { analyzePortfolio } from "../api/client";
import type { TickerEntry } from "../types/ui";

export function useAnalysis() {
  const {
    setStatus,
    addProgressMessage,
    setResults,
    setError,
  } = useAnalysisStore();

  async function runAnalysis(entries: TickerEntry[], period: string = "6mo") {
    setStatus("loading");

    const payload = {
      tickers: entries.map((e) => ({
        ticker: e.ticker,
        weight: e.weight,
      })),
      config: { period },
    };

    try {
      addProgressMessage("Connecting to market data...");
      const results = await analyzePortfolio(payload);
      addProgressMessage(
        `Analysis complete for ${results.tickers_succeeded.length} ticker(s)`
      );
      setResults(results);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Analysis failed. Please try again.";
      setError(message);
    }
  }

  return { runAnalysis };
}
