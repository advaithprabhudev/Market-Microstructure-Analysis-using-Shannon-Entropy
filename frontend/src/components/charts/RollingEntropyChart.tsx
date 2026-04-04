import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { RollingEntropyData } from "../../types/api";

interface Props {
  data: RollingEntropyData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entropy = payload[0]?.value as number;
  const regime = entropy < 0.5 ? "low" : entropy < 0.7 ? "medium" : "high";
  const regimeColor = regime === "low" ? "#7ec89b" : regime === "medium" ? "#e8d87c" : "#e87c7c";
  return (
    <div
      style={{
        background: "var(--bg-darker)",
        border: "1px solid var(--border)",
        borderRadius: 5,
        padding: "10px 14px",
        fontSize: 11,
      }}
    >
      <p style={{ color: "var(--accent)", marginBottom: 5, fontSize: 10 }}>{label}</p>
      <p style={{ color: "var(--text-dim)" }}>
        H̃ = <span style={{ color: "var(--text)", fontWeight: 600 }}>{entropy.toFixed(4)}</span>
      </p>
      <p style={{ color: regimeColor, marginTop: 2 }}>
        [{regime.toUpperCase()}]
      </p>
    </div>
  );
};

export function RollingEntropyChart({ data }: Props) {
  const chartData = data.dates.map((d, i) => ({
    date: d,
    entropy: data.normalized_entropy[i],
  }));

  const step = Math.max(1, Math.floor(chartData.length / 7));
  const tickIndices = Array.from(
    { length: Math.floor(chartData.length / step) },
    (_, i) => i * step
  );

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 6, right: 10, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(58,58,92,0.6)" />

          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
            tickLine={false}
            axisLine={false}
            ticks={tickIndices.map((i) => chartData[i]?.date).filter(Boolean)}
          />

          <YAxis
            domain={[0, 1]}
            tick={{ fill: "var(--text-muted)", fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={24}
            tickCount={5}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Regime threshold lines */}
          <ReferenceLine
            y={0.5}
            stroke="#7ec89b"
            strokeDasharray="3 4"
            strokeWidth={1}
            label={{ value: "0.5", position: "left", fill: "#7ec89b", fontSize: 8 }}
          />
          <ReferenceLine
            y={0.7}
            stroke="#e8d87c"
            strokeDasharray="3 4"
            strokeWidth={1}
            label={{ value: "0.7", position: "left", fill: "#e8d87c", fontSize: 8 }}
          />

          <Line
            type="monotone"
            dataKey="entropy"
            stroke="var(--accent)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive
            animationDuration={700}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
