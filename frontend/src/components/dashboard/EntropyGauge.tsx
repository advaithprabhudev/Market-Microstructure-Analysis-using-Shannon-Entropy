import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import type { Regime } from "../../types/api";
import { REGIME_COLORS } from "../../types/api";
import { RegimeBadge } from "./RegimeBadge";

interface Props {
  normalizedEntropy: number;
  regime: Regime;
  label?: string;
}

const GAUGE_R = 72;
const GAUGE_CX = 90;
const GAUGE_CY = 90;
const START_ANGLE = -180;
const END_ANGLE = 0;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function EntropyGauge({ normalizedEntropy, regime, label }: Props) {
  const springVal = useSpring(normalizedEntropy, { stiffness: 55, damping: 14 });

  useEffect(() => {
    springVal.set(normalizedEntropy);
  }, [normalizedEntropy, springVal]);

  const needleRotation = useTransform(springVal, [0, 1], [-90, 90]);
  const color = REGIME_COLORS[regime];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 180, height: 106 }}>
        <svg width={180} height={106} viewBox="0 0 180 106">
          <defs>
            <linearGradient id="gaugeTrackTerm" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7ec89b" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#e8d87c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e87c7c" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={arcPath(GAUGE_CX, GAUGE_CY, GAUGE_R, START_ANGLE, END_ANGLE)}
            fill="none"
            stroke="rgba(58,58,92,0.9)"
            strokeWidth={10}
            strokeLinecap="round"
          />

          {/* Color track */}
          <path
            d={arcPath(GAUGE_CX, GAUGE_CY, GAUGE_R, START_ANGLE, END_ANGLE)}
            fill="none"
            stroke="url(#gaugeTrackTerm)"
            strokeWidth={10}
            strokeLinecap="round"
            opacity={0.55}
          />

          {/* Threshold ticks */}
          {[0.4, 0.7].map((t) => {
            const angle = START_ANGLE + t * (END_ANGLE - START_ANGLE);
            const inner = polarToCartesian(GAUGE_CX, GAUGE_CY, GAUGE_R - 7, angle);
            const outer = polarToCartesian(GAUGE_CX, GAUGE_CY, GAUGE_R + 1, angle);
            return (
              <line
                key={t}
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="rgba(90,90,138,0.8)"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Needle */}
          <motion.g
            style={{ originX: "90px", originY: "90px", rotate: needleRotation }}
          >
            <line
              x1={GAUGE_CX} y1={GAUGE_CY}
              x2={GAUGE_CX} y2={GAUGE_CY - GAUGE_R + 14}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle cx={GAUGE_CX} cy={GAUGE_CY} r={4} fill={color} />
          </motion.g>

          {/* Value */}
          <text
            x={GAUGE_CX} y={GAUGE_CY + 18}
            textAnchor="middle"
            fill="var(--text)"
            fontSize={12}
            fontFamily="JetBrains Mono, monospace"
            fontWeight={600}
          >
            {normalizedEntropy.toFixed(3)}
          </text>

          {/* Scale labels */}
          <text x={10} y={100} fill="var(--text-muted)" fontSize={8} fontFamily="monospace">0</text>
          <text x={170} y={100} fill="var(--text-muted)" fontSize={8} fontFamily="monospace" textAnchor="end">1</text>
        </svg>
      </div>

      <RegimeBadge regime={regime} size="sm" />
      {label && (
        <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          {label}
        </span>
      )}
    </div>
  );
}
