import { motion } from "framer-motion";
import { useAnalysisStore } from "../../store/analysisStore";
import { REGIME_COLORS } from "../../types/api";

export function TickerSelector() {
  const { results, selectedTicker, viewMode, setSelectedTicker, setViewMode } =
    useAnalysisStore();

  if (!results) return null;

  function selectTicker(ticker: string) {
    setSelectedTicker(ticker);
    setViewMode("ticker");
  }

  function selectPortfolio() {
    setSelectedTicker(null);
    setViewMode("portfolio");
  }

  const isPortfolio = viewMode === "portfolio";

  return (
    <div
      className="flex items-center gap-0 overflow-x-auto"
      style={{
        borderBottom: "1px solid var(--border)",
        paddingBottom: 0,
      }}
    >
      {/* Portfolio tab */}
      <button
        onClick={selectPortfolio}
        className="relative px-4 py-2.5 text-xs transition-colors shrink-0"
        style={{
          color: isPortfolio ? "var(--accent)" : "var(--text-muted)",
          borderBottom: isPortfolio ? "2px solid var(--accent)" : "2px solid transparent",
          background: isPortfolio ? "rgba(232,168,124,0.06)" : "transparent",
          borderRight: "1px solid var(--border)",
          fontFamily: "inherit",
          fontWeight: isPortfolio ? 600 : 400,
          cursor: "pointer",
          letterSpacing: "0.04em",
        }}
      >
        portfolio
      </button>

      {/* Per-ticker tabs */}
      {results.ticker_analyses.map((analysis) => {
        const isActive = viewMode === "ticker" && selectedTicker === analysis.ticker;
        const regimeColor = REGIME_COLORS[analysis.regime_current];

        return (
          <motion.button
            key={analysis.ticker}
            onClick={() => selectTicker(analysis.ticker)}
            className="relative px-4 py-2.5 text-xs flex items-center gap-2 shrink-0 transition-colors"
            style={{
              color: isActive ? "var(--text)" : "var(--text-muted)",
              borderBottom: isActive ? "2px solid var(--text-dim)" : "2px solid transparent",
              background: isActive ? "rgba(255,255,255,0.03)" : "transparent",
              borderRight: "1px solid var(--border)",
              fontFamily: "inherit",
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
            whileHover={{ background: "rgba(255,255,255,0.02)" }}
          >
            <span
              style={{ width: 6, height: 6, borderRadius: "50%", background: regimeColor, flexShrink: 0 }}
            />
            {analysis.ticker}
            <span style={{ fontSize: 9, color: "var(--text-muted)", marginLeft: 2 }}>
              {analysis.entropy_normalized.toFixed(2)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
