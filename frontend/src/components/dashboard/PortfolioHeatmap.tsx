import { useAnalysisStore } from "../../store/analysisStore";
import { EntropyHeatmap } from "../charts/EntropyHeatmap";

export function PortfolioHeatmap() {
  const { results } = useAnalysisStore();
  if (!results) return null;

  return <EntropyHeatmap portfolio={results.portfolio} />;
}
