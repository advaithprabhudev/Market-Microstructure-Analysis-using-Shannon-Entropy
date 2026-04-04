import axios from "axios";
import type { PortfolioAnalysisResponse, TickerValidation } from "../types/api";

// Use Vite proxy path to avoid CORS issues in development
// Proxy in vite.config.ts routes /api -> http://localhost:8000
const http = axios.create({
  baseURL: "/api",
  timeout: 120_000,
  headers: { "Content-Type": "application/json" },
});

export interface PortfolioRequestPayload {
  tickers: Array<{ ticker: string; weight?: number }>;
  config?: {
    period?: string;
    rolling_window?: number;
    entropy_bins?: number;
    entropy_method?: string;
  };
}

export async function analyzePortfolio(
  payload: PortfolioRequestPayload
): Promise<PortfolioAnalysisResponse> {
  const { data } = await http.post<PortfolioAnalysisResponse>(
    "/analysis/portfolio",
    payload
  );
  return data;
}

export async function validateTicker(symbol: string): Promise<TickerValidation> {
  const { data } = await http.get<TickerValidation>("/tickers/validate", {
    params: { symbol },
  });
  return data;
}

export async function healthCheck(): Promise<{ status: string }> {
  const { data } = await http.get("/health");
  return data;
}
