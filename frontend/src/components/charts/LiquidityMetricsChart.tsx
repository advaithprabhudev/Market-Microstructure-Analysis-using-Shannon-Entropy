import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TickerAnalysis } from "../../types/api";

interface Props {
  liquidity: TickerAnalysis["liquidity"];
  priceDiscovery: TickerAnalysis["price_discovery"];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-darker)",
        border: "1px solid var(--border)",
        borderRadius: 5,
        padding: "8px 12px",
        fontSize: 11,
      }}
    >
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: "var(--cyan)" }}>
          {p.payload.metric}: <span style={{ color: "var(--text)" }}>{p.value.toFixed(3)}</span>
        </p>
      ))}
    </div>
  );
};

export function LiquidityMetricsChart({ liquidity, priceDiscovery }: Props) {
  const amihudNorm = 1 / (1 + liquidity.amihud_illiquidity);
  const rollNorm = 1 / (1 + liquidity.roll_spread_estimate);
  const kyleNorm = 1 / (1 + liquidity.kyle_lambda_proxy * 1e5);
  const efficiencyNorm = priceDiscovery.efficiency_ratio;
  const autocorrNorm = 1 - Math.min(Math.abs(priceDiscovery.autocorrelation_lag1), 1);

  const radarData = [
    { metric: "Liq Score",    value: liquidity.liquidity_score },
    { metric: "Amihud (inv)", value: amihudNorm },
    { metric: "Roll (inv)",   value: rollNorm },
    { metric: "Kyle λ (inv)", value: kyleNorm },
    { metric: "Price Eff.",   value: efficiencyNorm },
    { metric: "Low Autocorr", value: autocorrNorm },
  ];

  return (
    <div>
      <div style={{ width: "100%", height: 210 }}>
        <ResponsiveContainer>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(58,58,92,0.7)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "var(--text-muted)", fontSize: 9.5, fontFamily: "JetBrains Mono, monospace" }}
            />
            <Radar
              name="Metrics"
              dataKey="value"
              stroke="var(--cyan)"
              fill="var(--cyan)"
              fillOpacity={0.15}
              isAnimationActive
              animationDuration={700}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Raw values grid */}
      <div
        className="grid grid-cols-2 gap-1.5 mt-2 pt-3"
        style={{ borderTop: "1px dashed var(--border-dashed)" }}
      >
        {[
          { label: "Amihud Illiquidity", value: liquidity.amihud_illiquidity.toFixed(5) },
          { label: "Roll Spread",        value: liquidity.roll_spread_estimate.toFixed(4) },
          { label: "Kyle λ",             value: liquidity.kyle_lambda_proxy.toExponential(2) },
          { label: "Efficiency Ratio",   value: priceDiscovery.efficiency_ratio.toFixed(4) },
          { label: "Autocorr (lag-1)",   value: priceDiscovery.autocorrelation_lag1.toFixed(4) },
          { label: "Variance Ratio",     value: priceDiscovery.variance_ratio.toFixed(4) },
        ].map((m) => (
          <div
            key={m.label}
            className="flex justify-between items-center px-2.5 py-1.5"
            style={{
              background: "var(--bg-darker)",
              border: "1px solid var(--border)",
              borderRadius: 4,
            }}
          >
            <span style={{ fontSize: 9.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {m.label}
            </span>
            <span style={{ fontSize: 11, color: "var(--text)", fontWeight: 600, fontFamily: "inherit" }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
