import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "../components/layout/PageTransition";
import { SummaryBar } from "../components/dashboard/SummaryBar";
import { TickerSelector } from "../components/dashboard/TickerSelector";
import { EntropyGauge } from "../components/dashboard/EntropyGauge";
import { RegimeBadge } from "../components/dashboard/RegimeBadge";
import { RollingEntropyChart } from "../components/charts/RollingEntropyChart";
import { SpreadAnalysisChart } from "../components/charts/SpreadAnalysisChart";
import { OrderFlowChart } from "../components/charts/OrderFlowChart";
import { RegimeTimeline } from "../components/charts/RegimeTimeline";
import { LiquidityMetricsChart } from "../components/charts/LiquidityMetricsChart";
import { EntropyHeatmap } from "../components/charts/EntropyHeatmap";
import { useAnalysisStore } from "../store/analysisStore";
import { REGIME_COLORS } from "../types/api";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
};

const containerVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

/** Terminal window card with macOS chrome */
function TerminalCard({
  title,
  subtitle,
  children,
  filename,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  filename?: string;
}) {
  return (
    <motion.div variants={cardVariants} className="window">
      {/* Chrome */}
      <div className="window-chrome">
        <div className="window-dot" style={{ background: "var(--dot-red)" }} />
        <div className="window-dot" style={{ background: "var(--dot-yellow)" }} />
        <div className="window-dot" style={{ background: "var(--dot-green)" }} />
        <span className="window-title">{filename ?? title.toLowerCase().replace(/\s/g, "_")}.py</span>
      </div>
      {/* Header */}
      <div
        className="px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-baseline justify-between">
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", letterSpacing: "0.04em" }}>
            {title}
          </h3>
          {subtitle && (
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{subtitle}</span>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

function LoadingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 gap-5">
      <div className="window" style={{ padding: "24px 36px", minWidth: 280 }}>
        <div className="window-chrome" style={{ marginBottom: 16 }}>
          <div className="window-dot" style={{ background: "var(--dot-red)" }} />
          <div className="window-dot" style={{ background: "var(--dot-yellow)" }} />
          <div className="window-dot" style={{ background: "var(--dot-green)" }} />
          <span className="window-title">analysis.py</span>
        </div>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-8 h-8 rounded-full border-2"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
          />
          <p style={{ fontSize: 12, color: "var(--text-dim)" }}>
            fetching market data &amp; computing entropy...
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div
      style={{
        background: "var(--bg-darker)",
        border: "1px solid var(--border)",
        borderRadius: 5,
        padding: "8px 10px",
      }}
    >
      <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: highlight ?? "var(--text)", fontFamily: "inherit" }}>
        {value}
      </div>
    </div>
  );
}

function PortfolioView() {
  const { results } = useAnalysisStore();
  if (!results) return null;
  const { portfolio } = results;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-2 gap-5"
    >
      <TerminalCard
        title="Entropy Heatmap"
        subtitle="H̃ per ticker over time"
        filename="entropy_heatmap"
      >
        <EntropyHeatmap portfolio={portfolio} />
      </TerminalCard>

      <TerminalCard
        title="Portfolio Summary"
        subtitle="per-ticker entropy snapshot"
        filename="portfolio_summary"
      >
        <div className="space-y-2.5">
          {results.ticker_analyses.map((ta) => (
            <div key={ta.ticker} className="flex items-center gap-3">
              <span
                style={{ fontWeight: 700, fontSize: 12, color: "var(--text)", width: 56, flexShrink: 0 }}
              >
                {ta.ticker}
              </span>
              <div
                className="flex-1 overflow-hidden"
                style={{ height: 4, background: "var(--border)", borderRadius: 2 }}
              >
                <motion.div
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    background:
                      ta.entropy_normalized < 0.4
                        ? "var(--green)"
                        : ta.entropy_normalized < 0.7
                        ? "var(--yellow)"
                        : "var(--red)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${ta.entropy_normalized * 100}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-dim)", width: 44, textAlign: "right" }}>
                {ta.entropy_normalized.toFixed(3)}
              </span>
              <RegimeBadge regime={ta.regime_current} size="sm" />
            </div>
          ))}
        </div>

        {portfolio.tickers.length > 1 && (
          <div className="mt-5 pt-4" style={{ borderTop: "1px dashed var(--border-dashed)" }}>
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Return Correlation
            </p>
            <div className="overflow-x-auto">
              <table style={{ fontSize: 11, width: "100%" }}>
                <thead>
                  <tr>
                    <td style={{ paddingRight: 8, color: "var(--text-muted)" }} />
                    {portfolio.tickers.map((t) => (
                      <td key={t} style={{ padding: "0 8px", color: "var(--text-muted)", textAlign: "center" }}>
                        {t}
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolio.tickers.map((row, i) => (
                    <tr key={row}>
                      <td style={{ paddingRight: 8, color: "var(--text-muted)" }}>{row}</td>
                      {portfolio.correlation_matrix[i].map((val, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "3px 8px",
                            textAlign: "center",
                            color:
                              i === j
                                ? "var(--accent)"
                                : val > 0.5
                                ? "var(--yellow)"
                                : val < -0.2
                                ? "var(--green)"
                                : "var(--text-dim)",
                          }}
                        >
                          {val.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </TerminalCard>
    </motion.div>
  );
}

function TickerView() {
  const { getSelectedAnalysis } = useAnalysisStore();
  const analysis = getSelectedAnalysis();
  if (!analysis) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Top: overview card */}
      <motion.div variants={cardVariants} className="window">
        <div className="window-chrome">
          <div className="window-dot" style={{ background: "var(--dot-red)" }} />
          <div className="window-dot" style={{ background: "var(--dot-yellow)" }} />
          <div className="window-dot" style={{ background: "var(--dot-green)" }} />
          <span className="window-title">{analysis.ticker.toLowerCase()}_overview.py</span>
          <span
            className="ml-auto"
            style={{ fontSize: 10, color: "var(--accent)" }}
          >
            ${analysis.current_price.toFixed(2)}
          </span>
        </div>
        <div className="p-5 flex flex-wrap items-start gap-8">
          <EntropyGauge
            normalizedEntropy={analysis.entropy_normalized}
            regime={analysis.regime_current}
            label="normalized entropy"
          />

          <div className="flex-1 min-w-60">
            {/* Ticker name */}
            <div className="mb-4">
              <div
                style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}
              >
                {analysis.ticker}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {analysis.name} · {analysis.data_points} trading days
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="Efficiency Ratio"
                value={analysis.price_discovery.efficiency_ratio.toFixed(4)}
              />
              <Stat
                label="Liquidity Score"
                value={analysis.liquidity.liquidity_score.toFixed(4)}
                highlight="var(--cyan)"
              />
              <Stat
                label="Autocorr lag-1"
                value={analysis.price_discovery.autocorrelation_lag1.toFixed(4)}
              />
              <Stat
                label="Regime Transitions"
                value={String(analysis.regime_stats.transitions)}
                highlight="var(--yellow)"
              />
            </div>

            {/* Regime share bars */}
            <div className="mt-4 space-y-1.5">
              {(["low", "medium", "high"] as const).map((r) => {
                const pct = analysis.regime_stats[r]?.pct ?? 0;
                const color = REGIME_COLORS[r];
                return (
                  <div key={r} className="flex items-center gap-2">
                    <span style={{ fontSize: 9, width: 40, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {r}
                    </span>
                    <div
                      style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}
                    >
                      <motion.div
                        style={{ height: "100%", borderRadius: 2, background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <span style={{ fontSize: 9, color: "var(--text-muted)", width: 32, textAlign: "right" }}>
                      {(pct * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Regime timeline */}
      <TerminalCard
        title="Regime Timeline"
        subtitle="entropy-based classification"
        filename="regime_timeline"
      >
        <RegimeTimeline periods={analysis.regime_periods} />
      </TerminalCard>

      {/* 2-col charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <TerminalCard
          title="Rolling Entropy"
          subtitle="H̃ (30-day window)"
          filename="rolling_entropy"
        >
          <RollingEntropyChart data={analysis.rolling_entropy} />
        </TerminalCard>

        <TerminalCard
          title="Spread Analysis"
          subtitle="bid-ask spread bps + entropy"
          filename="spread_analysis"
        >
          <SpreadAnalysisChart data={analysis.spread} />
        </TerminalCard>

        <TerminalCard
          title="Order Flow"
          subtitle="VPIN toxicity score"
          filename="order_flow"
        >
          <OrderFlowChart
            data={analysis.order_flow}
            toxicityScore={analysis.order_flow.toxicity_score}
          />
        </TerminalCard>

        <TerminalCard
          title="Liquidity & Price Discovery"
          subtitle="Amihud · Roll · Kyle λ"
          filename="liquidity"
        >
          <LiquidityMetricsChart
            liquidity={analysis.liquidity}
            priceDiscovery={analysis.price_discovery}
          />
        </TerminalCard>
      </div>

    </motion.div>
  );
}

export function DashboardPage() {
  const { results, status, viewMode, setSelectedTicker, setViewMode } =
    useAnalysisStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "idle") navigate("/");
  }, [status, navigate]);

  useEffect(() => {
    if (results?.ticker_analyses.length) {
      setSelectedTicker(results.ticker_analyses[0].ticker);
      setViewMode("ticker");
    }
  }, [results, setSelectedTicker, setViewMode]);

  const isLoading = status === "loading";
  const hasError = status === "error";

  return (
    <PageTransition>
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Subtle grid */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(58,58,92,0.10) 1px, transparent 1px),
              linear-gradient(90deg, rgba(58,58,92,0.10) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            zIndex: 0,
          }}
        />

        <div className="relative z-10">
          {results && <SummaryBar />}

          <div
            className="px-5 pb-10"
            style={{ paddingTop: results ? 112 : 70, maxWidth: 1280, margin: "0 auto" }}
          >
            {isLoading && <LoadingOverlay />}

            {hasError && (
              <div className="flex flex-col items-center justify-center min-h-96 gap-5">
                <div className="window" style={{ padding: "24px 36px" }}>
                  <div className="window-chrome" style={{ marginBottom: 16 }}>
                    <div className="window-dot" style={{ background: "var(--dot-red)" }} />
                    <div className="window-dot" style={{ background: "var(--dot-yellow)" }} />
                    <div className="window-dot" style={{ background: "var(--dot-green)" }} />
                    <span className="window-title">error.log</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--red)", marginBottom: 16 }}>
                    analysis failed. check logs.
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    style={{
                      fontSize: 12,
                      color: "var(--accent)",
                      background: "rgba(232,168,124,0.1)",
                      border: "1px solid rgba(232,168,124,0.3)",
                      borderRadius: 4,
                      padding: "6px 16px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ← back
                  </button>
                </div>
              </div>
            )}

            {results && !isLoading && (
              <>
                {/* Ticker tab selector */}
                <div className="mb-6">
                  <TickerSelector />
                </div>

                {viewMode === "portfolio" ? <PortfolioView /> : <TickerView />}
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
