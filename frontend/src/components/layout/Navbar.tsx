import { motion } from "framer-motion";
import { useAnalysisStore } from "../../store/analysisStore";
import { useNavigate } from "react-router-dom";

export function Navbar() {
  const { results, reset } = useAnalysisStore();
  const navigate = useNavigate();

  function handleLogoClick() {
    reset();
    navigate("/");
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <motion.nav
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12"
      style={{
        height: "40px",
        background: "var(--bg-header)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(65, 72, 104, 0.3)",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Left: Status */}
      <button
        onClick={handleLogoClick}
        className="group"
        style={{
          fontSize: "10px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>sysload:</span>
        <span style={{ color: "var(--text-muted)", marginLeft: "8px" }}>
          CONNECTION ESTABLISHED VIA MMM-NODE-54
        </span>
      </button>

      {/* Right: Nav + Date */}
      <div className="flex items-center gap-6" style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {results && (
          <div className="flex items-center gap-2">
            {results.tickers_succeeded.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5"
                style={{
                  color: "var(--accent)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  background: "rgba(255, 158, 100, 0.08)",
                  fontSize: "9px",
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", whiteSpace: "nowrap" }}>
          <span style={{ color: "var(--text-muted)" }}>contact@mmm · timeline</span>
          <span style={{ color: "var(--text-muted)" }}>·</span>
          <span style={{ color: "var(--text-muted)" }}>{currentDate}</span>
        </div>
      </div>
    </motion.nav>
  );
}
