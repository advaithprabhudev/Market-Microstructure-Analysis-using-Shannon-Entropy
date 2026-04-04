import { create } from "zustand";
import type { PortfolioAnalysisResponse, TickerAnalysis } from "../types/api";
import type { TickerEntry, ViewMode, AnalysisStatus } from "../types/ui";

interface AnalysisStore {
  // Input state
  tickerEntries: TickerEntry[];
  setTickerEntries: (entries: TickerEntry[]) => void;
  addTickerEntry: (entry: TickerEntry) => void;
  updateTickerEntry: (ticker: string, updates: Partial<TickerEntry>) => void;
  removeTickerEntry: (ticker: string) => void;

  // Analysis state
  status: AnalysisStatus;
  progressMessages: string[];
  error: string | null;
  results: PortfolioAnalysisResponse | null;
  setStatus: (s: AnalysisStatus) => void;
  addProgressMessage: (msg: string) => void;
  setResults: (r: PortfolioAnalysisResponse) => void;
  setError: (e: string) => void;

  // Dashboard navigation
  selectedTicker: string | null;
  viewMode: ViewMode;
  setSelectedTicker: (t: string | null) => void;
  setViewMode: (m: ViewMode) => void;

  // Helpers
  getSelectedAnalysis: () => TickerAnalysis | null;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  tickerEntries: [],
  setTickerEntries: (entries) => set({ tickerEntries: entries }),
  addTickerEntry: (entry) =>
    set((s) => ({ tickerEntries: [...s.tickerEntries, entry] })),
  updateTickerEntry: (ticker, updates) =>
    set((s) => ({
      tickerEntries: s.tickerEntries.map((e) =>
        e.ticker === ticker ? { ...e, ...updates } : e
      ),
    })),
  removeTickerEntry: (ticker) =>
    set((s) => ({
      tickerEntries: s.tickerEntries.filter((e) => e.ticker !== ticker),
    })),

  status: "idle",
  progressMessages: [],
  error: null,
  results: null,
  setStatus: (status) => set({ status }),
  addProgressMessage: (msg) =>
    set((s) => ({ progressMessages: [...s.progressMessages, msg] })),
  setResults: (results) => set({ results, status: "success" }),
  setError: (error) => set({ error, status: "error" }),

  selectedTicker: null,
  viewMode: "portfolio",
  setSelectedTicker: (t) => set({ selectedTicker: t }),
  setViewMode: (m) => set({ viewMode: m }),

  getSelectedAnalysis: () => {
    const { results, selectedTicker } = get();
    if (!results || !selectedTicker) return null;
    return (
      results.ticker_analyses.find((a) => a.ticker === selectedTicker) ?? null
    );
  },

  reset: () =>
    set({
      tickerEntries: [],
      status: "idle",
      progressMessages: [],
      error: null,
      results: null,
      selectedTicker: null,
      viewMode: "portfolio",
    }),
}));
