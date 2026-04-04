import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { OrderFlowData } from "../../types/api";

interface Props {
  data: OrderFlowData;
  toxicityScore: number;
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
          {p.name}: {typeof p.value === "number" ? (p.value * 100).toFixed(1) + "%" : "—"}
        </p>
      ))}
    </div>
  );
};

export function OrderFlowChart({ data, toxicityScore }: Props) {
  const chartData = data.dates.map((d, i) => ({
    date: d,
    buy: data.buy_pressure[i],
    sell: -data.sell_pressure[i],
    net: data.net_flow[i],
  }));

  const step = Math.max(1, Math.floor(chartData.length / 7));
  const ticks = Array.from(
    { length: Math.floor(chartData.length / step) },
    (_, i) => chartData[i * step]?.date
  ).filter(Boolean);

  const toxAbs = Math.abs(toxicityScore);
  const toxColor = toxAbs < 0.1 ? "var(--green)" : toxAbs < 0.3 ? "var(--yellow)" : "var(--red)";

  return (
    <div>
      {/* VPIN badge */}
      <div className="flex justify-end mb-3">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            padding: "3px 10px",
            background: `${toxColor}15`,
            border: `1px solid ${toxColor}40`,
            color: toxColor,
            borderRadius: 3,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: toxColor, flexShrink: 0 }} />
          VPIN toxicity: {toxicityScore.toFixed(4)}
        </div>
      </div>

      <div style={{ width: "100%", height: 195 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 4, right: 10, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(58,58,92,0.6)" />

            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
              tickLine={false}
              axisLine={false}
              ticks={ticks}
            />
            <YAxis
              domain={[-1, 1]}
              tick={{ fill: "var(--text-muted)", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={28}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            />

            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(90,90,138,0.5)" strokeWidth={1} />

            <Bar dataKey="buy" name="Buy" fill="var(--green)" opacity={0.65} isAnimationActive animationDuration={600} />
            <Bar dataKey="sell" name="Sell" fill="var(--red)" opacity={0.65} isAnimationActive animationDuration={600} />
            <Line
              type="monotone"
              dataKey="net"
              name="Net Flow"
              stroke="var(--accent)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
