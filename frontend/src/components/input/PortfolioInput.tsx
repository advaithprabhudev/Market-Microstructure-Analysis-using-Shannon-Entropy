import { useState, useRef, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TickerTag } from "./TickerTag";
import { useAnalysisStore } from "../../store/analysisStore";
import { validateTicker } from "../../api/client";
import type { TickerEntry } from "../../types/ui";
import { useAnalysis } from "../../hooks/useAnalysis";
import { useNavigate } from "react-router-dom";

const PERIODS = ["1mo", "3mo", "6mo", "1y", "2y"];

export function PortfolioInput() {
  const [inputValue, setInputValue] = useState("");
  const [period, setPeriod] = useState("6mo");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { tickerEntries, addTickerEntry, updateTickerEntry, removeTickerEntry, status } =
    useAnalysisStore();
  const { runAnalysis } = useAnalysis();

  async function addTicker(raw: string) {
    const ticker = raw.toUpperCase().trim().replace(/[^A-Z0-9.\-^]/g, "");
    if (!ticker || tickerEntries.some((e) => e.ticker === ticker)) return;

    const entry: TickerEntry = { ticker, validationState: "validating" };
    addTickerEntry(entry);

    try {
      const result = await validateTicker(ticker);
      updateTickerEntry(ticker, {
        validationState: result.valid ? "valid" : "invalid",
        name: result.name,
        currentPrice: result.current_price,
        error: result.error,
      });
    } catch {
      updateTickerEntry(ticker, { validationState: "invalid", error: "Validation failed" });
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTicker(inputValue);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tickerEntries.length > 0) {
      removeTickerEntry(tickerEntries[tickerEntries.length - 1].ticker);
    }
  }

  async function handleAnalyze() {
    const validEntries = tickerEntries.filter((e) => e.validationState === "valid");
    if (validEntries.length === 0) return;
    navigate("/dashboard");
    await runAnalysis(validEntries, period);
  }

  const validCount = tickerEntries.filter((e) => e.validationState === "valid").length;
  const isAnalyzing = status === "loading";

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Ticker input box */}
      <div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.1em" }}>
          TICKERS
        </div>
        <div
          className="p-3 flex flex-wrap gap-2 items-center cursor-text"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            minHeight: 44,
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Prompt symbol */}
          <span style={{ color: "var(--accent)", fontSize: 13, userSelect: "none" }}>$</span>

          <AnimatePresence>
            {tickerEntries.map((entry) => (
              <TickerTag
                key={entry.ticker}
                entry={entry}
                onRemove={removeTickerEntry}
                onWeightChange={(t, w) => updateTickerEntry(t, { weight: w })}
              />
            ))}
          </AnimatePresence>

          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                addTicker(inputValue);
                setInputValue("");
              }
            }}
            placeholder={tickerEntries.length === 0 ? "AAPL MSFT..." : ""}
            className="flex-1 min-w-20 bg-transparent outline-none text-sm"
            style={{
              color: "var(--text)",
              fontFamily: "inherit",
              caretColor: "var(--accent)",
            }}
            disabled={isAnalyzing}
          />
        </div>
      </div>

      {/* Period selector */}
      <div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.1em" }}>
          PERIOD
        </div>
        <div className="flex items-center gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="transition-all text-xs flex-1"
              style={{
                background: period === p ? "rgba(232,168,124,0.15)" : "transparent",
                color: period === p ? "var(--accent)" : "var(--text-muted)",
                border: period === p ? "1px solid rgba(232,168,124,0.35)" : "1px solid var(--border)",
                borderRadius: 3,
                fontFamily: "inherit",
                cursor: "pointer",
                padding: "6px 8px",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div style={{ fontSize: 10, color: "var(--text-muted)", paddingTop: 4 }}>
        {tickerEntries.length > 0
          ? `${validCount}/${tickerEntries.length} valid`
          : "enter → add"}
      </div>

      {/* Run button */}
      <motion.button
        onClick={handleAnalyze}
        disabled={validCount === 0 || isAnalyzing}
        className="w-full px-4 py-2 text-xs font-medium transition-opacity"
        style={{
          background: validCount > 0 && !isAnalyzing ? "var(--accent)" : "rgba(232,168,124,0.2)",
          color: validCount > 0 && !isAnalyzing ? "#1a1a2e" : "var(--text-muted)",
          border: "none",
          borderRadius: 4,
          fontFamily: "inherit",
          cursor: validCount === 0 || isAnalyzing ? "not-allowed" : "pointer",
          fontWeight: 600,
          letterSpacing: "0.04em",
          marginTop: 8,
        }}
        whileHover={validCount > 0 && !isAnalyzing ? { scale: 1.02 } : {}}
        whileTap={validCount > 0 && !isAnalyzing ? { scale: 0.97 } : {}}
      >
        {isAnalyzing ? "running..." : "run analysis →"}
      </motion.button>
    </div>
  );
}
