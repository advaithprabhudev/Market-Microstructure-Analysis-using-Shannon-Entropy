import type { Regime } from "../../types/api";
import { REGIME_COLORS } from "../../types/api";

interface Props {
  regime: Regime;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: { fontSize: 10, padding: "2px 7px" },
  md: { fontSize: 11, padding: "3px 9px" },
  lg: { fontSize: 12, padding: "4px 12px" },
};

export function RegimeBadge({ regime, size = "md" }: Props) {
  const color = REGIME_COLORS[regime];
  const s = SIZE[size];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        borderRadius: 3,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        fontFamily: "inherit",
        ...s,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }}
      />
      {regime}
    </span>
  );
}
