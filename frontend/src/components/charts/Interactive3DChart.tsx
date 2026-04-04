import { useMemo, useState } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js/dist/plotly";
import type { RegimeSurface } from "../../types/api";

// Create the Plot component from the factory
const Plot = createPlotlyComponent(Plotly);

interface Props {
  data: RegimeSurface;
  title?: string;
}

export function Interactive3DChart({ data, title = "Multiscale Entropy Surface" }: Props) {
  const [hoverInfo, setHoverInfo] = useState<string>("");

  const plotData = useMemo(() => {
    return [
      {
        z: data.z_matrix,
        x: data.scales,
        y: data.dates,
        type: "surface",
        colorscale: "Viridis",
        showscale: true,
        colorbar: {
          title: "Entropy",
          thickness: 15,
          len: 0.7,
          x: 1.02,
        },
        hovertemplate:
          "<b>Scale:</b> %{x}<br><b>Date:</b> %{y}<br><b>Entropy:</b> %{z:.4f}<extra></extra>",
      } as any,
    ];
  }, [data]);

  const layout = {
    title: {
      text: title,
      font: { size: 14, color: "#e8a878", family: "JetBrains Mono" },
      x: 0.5,
      xanchor: "center",
    },
    scene: {
      xaxis: {
        title: "Scale (samples)",
        titlefont: { size: 11 },
        color: "#888",
        backgroundcolor: "rgba(58,58,92,0.05)",
        gridcolor: "rgba(58,58,92,0.15)",
        showbackground: true,
      },
      yaxis: {
        title: "Time Period",
        titlefont: { size: 11 },
        color: "#888",
        backgroundcolor: "rgba(58,58,92,0.05)",
        gridcolor: "rgba(58,58,92,0.15)",
        showbackground: true,
      },
      zaxis: {
        title: "Normalized Entropy (H̃)",
        titlefont: { size: 11 },
        color: "#888",
        backgroundcolor: "rgba(58,58,92,0.05)",
        gridcolor: "rgba(58,58,92,0.15)",
        showbackground: true,
      },
      camera: {
        eye: { x: 1.8, y: 1.8, z: 1.4 },
      },
      aspectratio: { x: 1, y: 1, z: 0.8 },
    },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: {
      family: "JetBrains Mono, monospace",
      size: 10,
      color: "#a0a0c0",
    },
    margin: { l: 40, r: 60, t: 50, b: 40 },
    showlegend: false,
    hovermode: "closest",
  } as any;

  return (
    <div style={{ width: "100%", minHeight: 520, position: "relative" }}>
      <div style={{ width: "100%", height: 520 }}>
        <Plot
          data={plotData}
          layout={layout}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d"],
            toImageButtonOptions: {
              format: "png",
              filename: "entropy_3d_surface",
              height: 700,
              width: 1000,
              scale: 2,
            },
          }}
          onHover={(data: any) => {
            if (data?.points?.[0]) {
              const point = data.points[0];
              setHoverInfo(
                `Scale: ${point.x} | Date: ${point.y} | Entropy: ${point.z?.toFixed(4)}`
              );
            }
          }}
          useResizeHandler
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      {hoverInfo && (
        <div
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            marginTop: 6,
            fontFamily: "JetBrains Mono, monospace",
            padding: "6px 0",
          }}
        >
          {hoverInfo}
        </div>
      )}
    </div>
  );
}
