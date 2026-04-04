import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SpreadData } from "../../types/api";

interface Props {
  data: SpreadData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
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
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, marginTop: 2 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(4) : p.value}
        </p>
      ))}
    </div>
  );
};

export function SpreadAnalysisChart({ data }: Props) {
  const n = data.dates.length;
  const entropyLen = data.spread_entropy_rolling.length;
  const offset = n - entropyLen;

  const chartData = data.dates.map((d, i) => ({
    date: d,
    spread_bps: data.spread_bps[i],
    entropy: i >= offset ? data.spread_entropy_rolling[i - offset] : null,
  }));

  const step = Math.max(1, Math.floor(chartData.length / 7));
  const ticks = Array.from(
    { length: Math.floor(chartData.length / step) },
    (_, i) => chartData[i * step]?.date
  ).filter(Boolean);

  const { stats } = data;

  return (
    <div>
      <div style={{ width: "100%", height: 210 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 6, right: 38, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(58,58,92,0.6)" />

            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
              tickLine={false}
              axisLine={false}
              ticks={ticks}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "var(--text-muted)", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={36}
              label={{ value: "bps", angle: -90, position: "insideLeft", fill: "var(--text-muted)", fontSize: 8 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 1]}
              tick={{ fill: "var(--text-muted)", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={24}
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar
              yAxisId="left"
              dataKey="spread_bps"
              name="Spread (bps)"
              fill="var(--blue)"
              opacity={0.55}
              isAnimationActive
              animationDuration={600}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="entropy"
              name="Spread H̃"
              stroke="var(--purple)"
              strokeWidth={1.5}
              dot={false}
              connectNulls
              isAnimationActive
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 mt-3 pt-3" style={{ borderTop: "1px dashed var(--border-dashed)" }}>
        {[
          { label: "Mean", value: stats.mean_bps.toFixed(2) + " bps" },
          { label: "Median", value: stats.median_bps.toFixed(2) + " bps" },
          { label: "Std Dev", value: stats.std_bps.toFixed(2) + " bps" },
          { label: "Skew", value: stats.skewness.toFixed(3) },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center"
            style={{
              background: "var(--bg-darker)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "6px 8px",
            }}
          >
            <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {s.label}
            </div>
            <div style={{ fontSize: 11, color: "var(--text)", marginTop: 3, fontWeight: 600 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
