import { motion } from "framer-motion";
import { useAnalysisStore } from "../../store/analysisStore";
import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";
import { REGIME_COLORS } from "../../types/api";

function KpiTile({
  label,
  value,
  decimals = 3,
  highlight,
  delay,
}: {
  label: string;
  value: number | string;
  decimals?: number;
  highlight?: string;
  delay?: number;
}) {
  const isNum = typeof value === "number";
  const animated = useAnimatedNumber(isNum ? value : 0, decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.35 }}
      className="flex flex-col items-start px-4 py-2 shrink-0"
      style={{ borderRight: "1px solid var(--border)" }}
    >
      <span
        className="whitespace-nowrap"
        style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 2, textTransform: "uppercase" }}
      >
        {label}
      </span>
      <span
        style={{ fontSize: 13, fontWeight: 600, color: highlight ?? "var(--text)", fontFamily: "inherit" }}
      >
        {isNum ? (
          <motion.span>{animated}</motion.span>
        ) : (
          String(value).toUpperCase()
        )}
      </span>
    </motion.div>
  );
}

export function SummaryBar() {
  const { results } = useAnalysisStore();
  if (!results) return null;

  const p = results.portfolio;
  const regimeColor = REGIME_COLORS[p.dominant_regime];

  return (
    <div
      className="fixed left-0 right-0 z-40 flex items-center overflow-x-auto"
      style={{
        top: 40,
        background: "rgba(30, 30, 53, 0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        height: 52,
      }}
    >
      <KpiTile label="Portfolio H̃" value={p.weighted_entropy} decimals={4} delay={0} />
      <KpiTile label="Regime" value={p.dominant_regime} decimals={0} highlight={regimeColor} delay={0.05} />
      <KpiTile label="Liquidity" value={p.avg_liquidity_score} decimals={3} delay={0.1} />
      <KpiTile label="Dispersion" value={p.entropy_dispersion} decimals={4} delay={0.15} />
      <KpiTile label="Efficient" value={p.most_efficient_ticker} decimals={0} highlight="var(--cyan)" delay={0.2} />
      <KpiTile label="Chaotic" value={p.least_efficient_ticker} decimals={0} highlight="var(--yellow)" delay={0.25} />
      <div
        className="px-4 shrink-0 flex items-center gap-3"
        style={{ marginLeft: "auto" }}
      >
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "inherit" }}>
          {results.computation_time_ms.toFixed(0)}ms
        </span>
        {results.status === "partial" && (
          <span style={{ fontSize: 10, color: "var(--yellow)" }}>⚠ partial</span>
        )}
        {results.status === "success" && (
          <span style={{ fontSize: 10, color: "var(--green)" }}>● ok</span>
        )}
      </div>
    </div>
  );
}
