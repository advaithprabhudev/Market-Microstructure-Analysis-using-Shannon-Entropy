import { motion } from "framer-motion";
import type { TickerEntry } from "../../types/ui";

interface Props {
  entry: TickerEntry;
  onRemove: (ticker: string) => void;
  onWeightChange?: (ticker: string, weight: number) => void;
}

const STATE_STYLES = {
  idle:       { bg: "rgba(58,58,92,0.6)",  border: "rgba(90,90,138,0.5)",  color: "var(--text-dim)" },
  validating: { bg: "rgba(232,168,124,0.1)", border: "rgba(232,168,124,0.3)", color: "var(--accent)" },
  valid:      { bg: "rgba(126,200,155,0.12)", border: "rgba(126,200,155,0.4)", color: "var(--green)" },
  invalid:    { bg: "rgba(232,124,124,0.12)", border: "rgba(232,124,124,0.4)", color: "var(--red)" },
};

export function TickerTag({ entry, onRemove }: Props) {
  const { ticker, validationState, name } = entry;
  const style = STATE_STYLES[validationState];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 4,
        transition: "background 0.25s, border-color 0.25s",
        fontFamily: "inherit",
      }}
      title={name}
    >
      {validationState === "validating" && (
        <motion.div
          className="w-2 h-2 rounded-full border"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
        />
      )}
      {validationState === "valid" && (
        <span style={{ color: "var(--green)", fontSize: 9 }}>●</span>
      )}
      {validationState === "invalid" && (
        <span style={{ color: "var(--red)", fontSize: 9 }}>●</span>
      )}

      <span style={{ fontWeight: 600, color: style.color }}>{ticker}</span>

      <button
        onClick={() => onRemove(ticker)}
        className="ml-0.5 transition-opacity"
        style={{ color: "var(--text-muted)", fontSize: 11, opacity: 0.6, cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
        aria-label={`Remove ${ticker}`}
      >
        ×
      </button>
    </motion.div>
  );
}
