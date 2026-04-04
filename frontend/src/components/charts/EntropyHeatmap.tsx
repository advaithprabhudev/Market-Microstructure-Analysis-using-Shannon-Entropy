import { motion } from "framer-motion";
import type { PortfolioSummary } from "../../types/api";

interface Props {
  portfolio: PortfolioSummary;
}

// Terminal palette: green → yellow → red
function entropyToColor(value: number): string {
  if (value < 0.4) {
    const t = value / 0.4;
    const r = Math.round(126 + t * (232 - 126));
    const g = Math.round(200 + t * (216 - 200));
    const b = Math.round(155 + t * (124 - 155));
    return `rgb(${r},${g},${b})`;
  } else if (value < 0.7) {
    const t = (value - 0.4) / 0.3;
    const r = Math.round(232 + t * (232 - 232));
    const g = Math.round(216 + t * (124 - 216));
    const b = Math.round(124 + t * (124 - 124));
    return `rgb(${r},${g},${b})`;
  } else {
    return "#e87c7c";
  }
}

export function EntropyHeatmap({ portfolio }: Props) {
  const { heatmap_data, tickers } = portfolio;

  const byTicker: Record<string, typeof heatmap_data> = {};
  tickers.forEach((t) => { byTicker[t] = []; });
  heatmap_data.forEach((d) => {
    if (byTicker[d.ticker]) byTicker[d.ticker].push(d);
  });

  const allDates = Array.from(new Set(heatmap_data.map((d) => d.date))).sort();

  if (allDates.length === 0 || tickers.length === 0) return null;

  const cellW = Math.max(4, Math.min(18, Math.floor(540 / allDates.length)));

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex">
          {/* Y-axis */}
          <div className="flex flex-col gap-px" style={{ width: 58 }}>
            <div style={{ height: 18 }} />
            {tickers.map((t) => (
              <div
                key={t}
                className="flex items-center pr-2"
                style={{ height: 20, fontSize: 10, color: "var(--text-dim)", fontFamily: "inherit" }}
              >
                {t}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div>
            {/* X-axis dates */}
            <div className="flex" style={{ height: 18 }}>
              {allDates
                .filter((_, i) => i % Math.max(1, Math.floor(allDates.length / 10)) === 0)
                .map((d) => (
                  <div
                    key={d}
                    style={{
                      minWidth: cellW * Math.max(1, Math.floor(allDates.length / 10)),
                      overflow: "hidden",
                      fontSize: 8,
                      color: "var(--text-muted)",
                      fontFamily: "inherit",
                    }}
                  >
                    {d.slice(5)}
                  </div>
                ))}
            </div>

            {/* Heatmap rows */}
            {tickers.map((ticker, rowIdx) => {
              const dateMap: Record<string, number> = {};
              (byTicker[ticker] ?? []).forEach((d) => {
                dateMap[d.date] = d.value;
              });

              return (
                <div key={ticker} className="flex gap-px" style={{ marginBottom: 2 }}>
                  {allDates.map((date, colIdx) => {
                    const val = dateMap[date];
                    const hasVal = val !== undefined;
                    return (
                      <motion.div
                        key={date}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: (rowIdx * allDates.length + colIdx) * 0.001 }}
                        style={{
                          width: cellW,
                          height: 20,
                          borderRadius: 1,
                          background: hasVal ? entropyToColor(val) : "var(--border)",
                          opacity: hasVal ? 0.8 : 0.25,
                        }}
                        title={hasVal ? `${ticker} ${date}: ${val.toFixed(4)}` : undefined}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-2 mt-3">
          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Low H̃</span>
          <div
            style={{
              height: 6,
              flex: 1,
              maxWidth: 120,
              borderRadius: 2,
              background: "linear-gradient(to right, #7ec89b, #e8d87c, #e87c7c)",
              opacity: 0.75,
            }}
          />
          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>High H̃</span>
        </div>
      </div>
    </div>
  );
}
