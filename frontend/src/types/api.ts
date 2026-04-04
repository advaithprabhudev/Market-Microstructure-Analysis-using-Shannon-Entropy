export interface RollingEntropyData {
  dates: string[];
  entropy: number[];
  normalized_entropy: number[];
  regimes: string[];
}

export interface SpreadData {
  dates: string[];
  spread_bps: number[];
  spread_entropy_rolling: number[];
  stats: {
    mean_bps: number;
    median_bps: number;
    std_bps: number;
    skewness: number;
    entropy: number;
    entropy_normalized: number;
  };
}

export interface OrderFlowData {
  dates: string[];
  buy_pressure: number[];
  sell_pressure: number[];
  net_flow: number[];
  toxicity_score: number;
}

export interface RegimePeriod {
  start_date: string;
  end_date: string;
  regime: "low" | "medium" | "high";
  avg_entropy: number;
  duration_days: number;
}

export interface MultiscaleSurface {
  dates: string[];
  scales: number[];
  z_matrix: number[][];
}

export interface RegimeSurface {
  dates: string[];
  scales: number[];
  z_matrix: number[][];
}

export interface TickerAnalysis {
  ticker: string;
  name: string;
  current_price: number;
  data_points: number;
  entropy_current: number;
  entropy_normalized: number;
  regime_current: "low" | "medium" | "high";
  rolling_entropy: RollingEntropyData;
  spread: SpreadData;
  order_flow: OrderFlowData;
  liquidity: {
    amihud_illiquidity: number;
    kyle_lambda_proxy: number;
    turnover_ratio: number;
    roll_spread_estimate: number;
    liquidity_score: number;
  };
  price_discovery: {
    efficiency_ratio: number;
    autocorrelation_lag1: number;
    variance_ratio: number;
    is_efficient: boolean;
  };
  regime_periods: RegimePeriod[];
  regime_stats: {
    low: { count: number; pct: number; avg_entropy: number };
    medium: { count: number; pct: number; avg_entropy: number };
    high: { count: number; pct: number; avg_entropy: number };
    transitions: number;
  };
  multiscale_surface?: MultiscaleSurface;
  regime_surface?: RegimeSurface;
}

export interface PortfolioEntropySurface {
  dates: string[];
  tickers: string[];
  weights: number[];
  z_matrix: number[][];
}

export interface PortfolioSummary {
  tickers: string[];
  weights: number[];
  weighted_entropy: number;
  dominant_regime: "low" | "medium" | "high";
  most_efficient_ticker: string;
  least_efficient_ticker: string;
  avg_liquidity_score: number;
  entropy_dispersion: number;
  correlation_matrix: number[][];
  ticker_entropy_map: Record<string, number>;
  heatmap_data: Array<{ date: string; ticker: string; value: number }>;
  portfolio_entropy_surface?: PortfolioEntropySurface;
}

export interface PortfolioAnalysisResponse {
  status: "success" | "partial" | "error";
  computation_time_ms: number;
  tickers_requested: string[];
  tickers_succeeded: string[];
  tickers_failed: Record<string, string>;
  config: {
    period: string;
    rolling_window: number;
    entropy_bins: number;
    entropy_method: string;
  };
  portfolio: PortfolioSummary;
  ticker_analyses: TickerAnalysis[];
}

export interface TickerValidation {
  valid: boolean;
  ticker: string;
  name?: string;
  exchange?: string;
  sector?: string;
  current_price?: number;
  error?: string;
}

export type Regime = "low" | "medium" | "high";

export const REGIME_COLORS: Record<Regime, string> = {
  low: "#7ec89b",
  medium: "#e8d87c",
  high: "#e87c7c",
};
