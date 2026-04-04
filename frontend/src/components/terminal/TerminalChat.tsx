import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAnalysisStore } from "../../store/analysisStore";
import { analyzePortfolio } from "../../api/client";
import type { PortfolioAnalysisResponse } from "../../types/api";

interface ChatMessage {
  id: string;
  type: "command" | "output" | "error" | "help";
  content: string;
  timestamp: Date;
}

export function TerminalChat() {
  const navigate = useNavigate();
  const { tickerEntries, setResults } = useAnalysisStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      type: "help",
      content: "Market Microstructure Terminal v1.0 - Type /help for available commands",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const analysisCache = useRef<PortfolioAnalysisResponse | null>(null);
  const messageCountRef = useRef(1); // Unique counter for message IDs

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: ChatMessage["type"], content: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${messageCountRef.current++}`,
      type,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleCommand = async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage("command", trimmed);

    if (trimmed === "/help") {
      addMessage(
        "help",
        `Available Commands:
/entropy-analysis - Run analysis on selected tickers and show statistics
/entropy-2d - Display 2D graphs of entropy metrics
/entropy-3d - Display 3D interactive visualization
/clear - Clear chat history
/help - Show this help message`
      );
      return;
    }

    if (trimmed === "/clear") {
      setMessages([
        {
          id: "init",
          type: "help",
          content: "Chat history cleared",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const validTickers = tickerEntries.filter((e) => e.validationState === "valid");
    if (validTickers.length === 0) {
      addMessage("error", "Error: No valid tickers selected. Please add tickers in the portfolio input above.");
      return;
    }

    if (trimmed === "/entropy-analysis") {
      try {
        setIsAnalyzing(true);
        addMessage("output", "Fetching market data and computing entropy metrics...");

        const payload = {
          tickers: validTickers.map((e) => ({
            ticker: e.ticker,
            weight: e.weight,
          })),
          config: { period: "6mo" },
        };

        const results = await analyzePortfolio(payload);
        analysisCache.current = results;
        setResults(results);

        let analysisText = `✓ Analysis Complete (${results.computation_time_ms.toFixed(0)}ms)\n\n`;
        analysisText += `Tickers Analyzed: ${results.tickers_succeeded.join(", ")}\n`;
        analysisText += `Portfolio Weighted Entropy: ${results.portfolio.weighted_entropy.toFixed(4)}\n`;
        analysisText += `Dominant Regime: ${results.portfolio.dominant_regime.toUpperCase()}\n`;
        analysisText += `Average Liquidity Score: ${results.portfolio.avg_liquidity_score.toFixed(4)}\n`;
        analysisText += `Entropy Dispersion: ${results.portfolio.entropy_dispersion.toFixed(4)}\n\n`;
        analysisText += `Per-Ticker Summary:\n`;

        results.ticker_analyses.forEach((ta) => {
          analysisText += `\n${ta.ticker} (${ta.name}):\n`;
          analysisText += `  Entropy: ${ta.entropy_normalized.toFixed(4)} [${ta.regime_current.toUpperCase()}]\n`;
          analysisText += `  Efficiency Ratio: ${ta.price_discovery.efficiency_ratio.toFixed(4)}\n`;
          analysisText += `  Liquidity Score: ${ta.liquidity.liquidity_score.toFixed(4)}\n`;
          analysisText += `  Avg Spread: ${ta.spread.stats.mean_bps.toFixed(4)} bps\n`;
          analysisText += `  Regime Transitions: ${ta.regime_stats.transitions}`;
        });

        addMessage("output", analysisText);

        // Navigate to dashboard after analysis completes
        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      } catch (err) {
        addMessage("error", `Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    if (trimmed === "/entropy-2d") {
      if (!analysisCache.current) {
        addMessage("error", "Error: No analysis data available. Run /entropy-analysis first.");
        return;
      }

      const results = analysisCache.current;
      let output2d = `2D ENTROPY VISUALIZATION\n\n`;
      output2d += `Portfolio-level entropy over time:\n`;

      results.ticker_analyses.forEach((ta) => {
        output2d += `\n${ta.ticker}:\n`;
        output2d += `  Rolling Entropy (30-day window):\n`;

        const dates = ta.rolling_entropy.dates;
        const entropy = ta.rolling_entropy.normalized_entropy;

        const step = Math.ceil(dates.length / 10);
        for (let i = 0; i < dates.length; i += step) {
          const bar = "█".repeat(Math.floor(entropy[i] * 50));
          output2d += `  ${dates[i]}: ${bar} ${entropy[i].toFixed(3)}\n`;
        }

        output2d += `\n  Spread Analysis (basis points):\n`;
        const spreadDates = ta.spread.dates;
        const spreads = ta.spread.spread_bps;
        const spreadStep = Math.ceil(spreadDates.length / 10);
        for (let i = 0; i < spreadDates.length; i += spreadStep) {
          const bar = "▓".repeat(Math.floor(spreads[i] / 2));
          output2d += `  ${spreadDates[i]}: ${bar} ${spreads[i].toFixed(2)} bps\n`;
        }
      });

      addMessage("output", output2d);

      // Navigate to dashboard for 2D visualization
      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
      return;
    }

    if (trimmed === "/entropy-3d") {
      if (!analysisCache.current) {
        addMessage("error", "Error: No analysis data available. Run /entropy-analysis first.");
        return;
      }

      const results = analysisCache.current;
      let output3d = `3D ENTROPY SURFACE\n\n`;
      output3d += `Multi-scale entropy analysis (scales: 10, 20, 30, 60 periods):\n\n`;

      results.ticker_analyses.forEach((ta) => {
        output3d += `${ta.ticker} - Multiscale Surface:\n`;

        if (ta.multiscale_surface && ta.multiscale_surface.dates.length > 0) {
          const ms = ta.multiscale_surface;
          output3d += `  Dates: ${ms.dates[0]} to ${ms.dates[ms.dates.length - 1]}\n`;
          output3d += `  Scales Analyzed: ${ms.scales.join(", ")} periods\n`;
          output3d += `  Surface Points: ${ms.dates.length} × ${ms.scales.length}\n`;
          output3d += `  Data Shape: ${ms.z_matrix.length}×${ms.z_matrix[0]?.length || 0} matrix\n\n`;

          if (ms.z_matrix.length > 0) {
            output3d += `  Sample values (scale x date):\n`;
            const sampleRows = Math.min(3, ms.z_matrix.length);
            const sampleCols = Math.min(5, ms.z_matrix[0]?.length || 0);

            for (let i = 0; i < sampleRows; i++) {
              output3d += `  Scale ${ms.scales[i]}: `;
              for (let j = 0; j < sampleCols; j++) {
                output3d += `${(ms.z_matrix[i]?.[j] ?? 0).toFixed(2)} `;
              }
              output3d += "...\n";
            }
          }
        } else {
          output3d += `  No 3D surface data available for this ticker\n`;
        }
        output3d += "\n";
      });

      output3d += `View full 3D interactive visualizations by navigating to the Dashboard\n`;
      addMessage("output", output3d);

      // Navigate to dashboard for 3D visualization
      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
      return;
    }

    addMessage("error", `Unknown command: ${trimmed}. Type /help for available commands.`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommand(inputValue);
      setInputValue("");
    }
  };

  return (
    <div style={{ marginTop: 32, maxWidth: 640 }}>
      {/* Terminal window */}
      <div
        style={{
          background: "var(--bg-window)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: 400,
        }}
      >
        {/* Chrome */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg-darker)" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--dot-red)" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--dot-yellow)" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--dot-green)" }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8, letterSpacing: "0.04em" }}>
            entropy_terminal.py
          </span>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            lineHeight: 1.6,
            color: "var(--text-dim)",
          }}
        >
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                style={{
                  marginBottom: 12,
                  color:
                    msg.type === "command"
                      ? "var(--accent)"
                      : msg.type === "error"
                      ? "var(--red)"
                      : msg.type === "help"
                      ? "var(--green)"
                      : "var(--text-dim)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.type === "command" && <span>$ {msg.content}\n</span>}
                {msg.type !== "command" && msg.content}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "12px 16px",
            background: "var(--bg-darker)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, userSelect: "none" }}>
            $
          </span>
          <input
            ref={(el) => el?.focus()}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAnalyzing}
            placeholder="Type /help for commands"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          {isAnalyzing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "2px solid var(--accent)",
                borderTopColor: "transparent",
              }}
            />
          )}
        </div>
      </div>

      {/* Command info */}
      <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Try: /help · /entropy-analysis · /entropy-2d · /entropy-3d · /clear
      </div>
    </div>
  );
}
