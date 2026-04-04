import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "../components/layout/PageTransition";
import { PortfolioInput } from "../components/input/PortfolioInput";
import { TerminalChat } from "../components/terminal/TerminalChat";
import { useAnalysisStore } from "../store/analysisStore";

// Pixel art MMM logo data (1 = filled, 0 = empty)
const MMM_PIXELS = [
  [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
];

// Seeded random heights for liquidity bars (deterministic so no layout shift)
const BAR_HEIGHTS = Array.from({ length: 22 }, (_, i) => {
  const seed = i * 73;
  return 30 + ((seed * 37) % 60);
});

function PixelLogo() {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "grid", gridTemplateRows: "repeat(5, 10px)", gap: "2px", width: "fit-content" }}>
        {MMM_PIXELS.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: "grid", gridTemplateColumns: `repeat(${row.length}, 10px)`, gap: "2px" }}>
            {row.map((pixel, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                style={{
                  width: "10px",
                  height: "10px",
                  background: pixel === 1 ? "var(--accent)" : "transparent",
                  borderRadius: "1px",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiquidityBars() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "140px" }}>
      {BAR_HEIGHTS.map((height, i) => (
        <motion.div
          key={i}
          style={{
            flex: 1,
            background: `linear-gradient(to top, rgba(65, 72, 104, 0.4) 0%, var(--accent) ${100 - 30}%)`,
            borderRadius: "2px",
            height: `${height}px`,
            minHeight: "30px",
            opacity: 0.8,
          }}
          animate={{ height: [height, height + 5, height, height - 3] }}
          transition={{ duration: 4 + (i % 2) * 0.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function BlinkCursor() {
  return (
    <motion.span
      style={{
        width: "8px",
        height: "14px",
        background: "var(--accent)",
        display: "inline-block",
        marginLeft: "4px",
      }}
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function LandingPage() {
  const { status, progressMessages } = useAnalysisStore();
  const isLoading = status === "loading";

  return (
    <PageTransition>
      <div style={{ background: "var(--bg)" }}>
        {/* CENTERED HERO + TERMINAL SECTION */}
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          {/* HERO SECTION */}
          <section style={{ padding: "60px 60px 48px", maxWidth: 1100, width: "100%" }}>
            {/* Status line */}
            <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              marginBottom: 32,
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Sysload: CONNECTION ESTABLISHED VIA MMM-NODE-54
          </motion.div>

          {/* Pixel art logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PixelLogo />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "var(--accent)",
              margin: 0,
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            MARKET MICROSTRUCTURE
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              letterSpacing: "0.2em",
              marginTop: 12,
              marginBottom: 0,
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            QUANTITATIVE RESEARCH & ORDER FLOW DYNAMICS
          </motion.p>

          {/* Timestamp */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              marginTop: 20,
              marginBottom: 0,
            }}
          >
            Last login: {new Date().toLocaleString()} on ttys000
          </motion.p>
        </section>

        {/* TERMINAL / PORTFOLIO INPUT SECTION */}
        <section style={{ padding: "0 60px 48px", maxWidth: 1100 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Command prompt line */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <span style={{ color: "var(--accent)", fontSize: "13px", fontWeight: 500 }}>›</span>
              <span style={{ fontSize: "13px", color: "var(--text-dim)", fontWeight: 500 }}>/analyze;</span>
              <BlinkCursor />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(65, 72, 104, 0.3)", marginBottom: 20 }} />

            {/* Section label */}
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                marginBottom: 20,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              PORTFOLIO ANALYSIS
            </div>

            {/* Portfolio input - preserve all functionality */}
            <div style={{ maxWidth: 640 }}>
              <PortfolioInput />
            </div>

            {/* Terminal chat interface */}
            <div style={{ maxWidth: 640 }}>
              <TerminalChat />
            </div>

            {/* Loading log */}
            <AnimatePresence>
              {isLoading && progressMessages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: 24 }}
                >
                  <div style={{ height: 1, background: "rgba(65, 72, 104, 0.3)", marginBottom: 16 }} />
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.12em",
                      marginBottom: 12,
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    ANALYSIS LOG
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {progressMessages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.12 }}
                        style={{
                          fontSize: "11px",
                          color: "var(--text-dim)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ color: "var(--green)" }}>✓</span>
                        <span>{msg}</span>
                      </motion.div>
                    ))}
                    <motion.div
                      style={{
                        fontSize: "11px",
                        color: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <motion.div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          border: "1px solid var(--accent)",
                          borderTopColor: "transparent",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      />
                      <span>computing entropy metrics...</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
        </div>

        {/* DATA SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          style={{
            background: "var(--bg-card)",
            borderTop: "1px solid rgba(65, 72, 104, 0.3)",
            borderBottom: "1px solid rgba(65, 72, 104, 0.3)",
            padding: "32px 60px",
            marginTop: 48,
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "7fr 5fr", gap: 48 }}>
            {/* Left: Liquidity Map */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  LIVE LIQUIDITY MAP [BTCUSD]
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    color: "var(--green)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--green)",
                      display: "inline-block",
                    }}
                  />
                  SYNC: ACTIVE
                </span>
              </div>
              <LiquidityBars />
            </div>

            {/* Right: Statistical Metadata */}
            <div>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  marginBottom: 20,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                // STATISTICAL_METADATA
              </div>
              {[
                { label: "Mean Spread", value: "0.024 bps" },
                { label: "Adv. Imbalance", value: "+1.62%", positive: true },
                { label: "Latency [50R]", value: "14.2 μs" },
              ].map(({ label, value, positive }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottom: "1px solid rgba(65, 72, 104, 0.2)",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: positive ? "var(--green)" : "var(--text)",
                      fontWeight: 600,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FOOTER */}
        <footer
          style={{
            background: "var(--bg-header)",
            borderTop: "1px solid rgba(65, 72, 104, 0.3)",
            padding: "12px 60px",
            marginTop: 0,
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              MNSS · MARKET NODE · ENTROPY FRAMEWORK v2.0
            </span>
            <div style={{ display: "flex", gap: 24 }}>
              {["SHANNON", "RÉNYI", "AMIHUD", "ROLL", "KYLE"].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
