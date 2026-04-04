export interface TickerEntry {
  ticker: string;
  weight?: number;
  validationState: "idle" | "validating" | "valid" | "invalid";
  name?: string;
  currentPrice?: number;
  error?: string;
}

export type ViewMode = "portfolio" | "ticker";

export type AnalysisStatus = "idle" | "loading" | "success" | "error";
