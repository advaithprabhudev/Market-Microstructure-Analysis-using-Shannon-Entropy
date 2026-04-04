import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RegimePeriod } from "../../types/api";
import { REGIME_COLORS } from "../../types/api";

interface Props {
  periods: RegimePeriod[];
}

export function RegimeTimeline({ periods }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!periods.length) return null;

  const totalDays = periods.reduce((s, p) => s + p.duration_days, 0);

  return (
    <div className="w-full">
      {/* Timeline bar */}
      <div className="flex w-full overflow-hidden gap-px" style={{ height: 32, borderRadius: 4 }}>
        {periods.map((period, i) => {
          const widthPct = (period.duration_days / totalDays) * 100;
          const color = REGIME_COLORS[period.regime];

          return (
            <motion.div
              key={i}
              className="relative cursor-pointer"
              style={{
                width: `${widthPct}%`,
                background: `${color}30`,
                borderBottom: `2px solid ${color}`,
                minWidth: widthPct < 0.8 ? 2 : undefined,
                transformOrigin: "bottom",
              }}
              whileHover={{ scaleY: 1.25, background: `${color}55` }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </div>

      {/* Hover tooltip */}
      <div style={{ minHeight: 36 }}>
        <AnimatePresence>
          {hovered !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="mt-2 inline-flex items-center gap-5"
              style={{
                background: "var(--bg-darker)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "6px 14px",
                fontSize: 10,
              }}
            >
              <span
                style={{ fontWeight: 700, color: REGIME_COLORS[periods[hovered].regime], letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                {periods[hovered].regime}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                {periods[hovered].duration_days}d
              </span>
              <span style={{ color: "var(--text-dim)" }}>
                {periods[hovered].start_date} → {periods[hovered].end_date}
              </span>
              <span style={{ color: "var(--accent)" }}>
                avg H̃ = {periods[hovered].avg_entropy.toFixed(4)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2">
        {(["low", "medium", "high"] as const).map((r) => {
          const count = periods.filter((p) => p.regime === r).length;
          const days = periods.filter((p) => p.regime === r).reduce((s, p) => s + p.duration_days, 0);
          if (days === 0) return null;
          return (
            <div
              key={r}
              className="flex items-center gap-2"
              style={{ fontSize: 10, color: "var(--text-muted)" }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: REGIME_COLORS[r], flexShrink: 0 }} />
              <span style={{ color: REGIME_COLORS[r], fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {r}
              </span>
              <span>{days}d ({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
