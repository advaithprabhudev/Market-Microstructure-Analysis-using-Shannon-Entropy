import { useMemo, useState } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js/dist/plotly";
import type { OrderFlowData, SpreadData } from "../../types/api";

// Create the Plot component from the factory
const Plot = createPlotlyComponent(Plotly);

interface Props {
  orderFlow: OrderFlowData;
  spread: SpreadData;
  title?: string;
}

export function OrderFlowSpread3D({
  orderFlow,
  spread,
  title = "Order Flow & Spread Dynamics",
}: Props) {
  const [hoverInfo, setHoverInfo] = useState<string>("");

  const plotData = useMemo(() => {
    // Handle data validation and alignment
    if (!orderFlow?.dates || !orderFlow.dates.length || !spread?.dates || !spread.dates.length) {
      return [{
        x: [],
        y: [],
        z: [],
        mode: "markers",
        type: "scatter3d",
        hovertemplate: "No data available<extra></extra>",
      }];
    }

    // Find overlapping date range
    const ofLen = orderFlow.dates.length;
    const spLen = spread.dates.length;
    const minLen = Math.min(ofLen, spLen);

    if (minLen === 0) {
      return [{
        x: [],
        y: [],
        z: [],
        mode: "markers",
        type: "scatter3d",
        hovertemplate: "No overlapping dates<extra></extra>",
      }];
    }

    // Align data using the last minLen elements (most recent data)
    const ofOffsetStart = Math.max(0, ofLen - minLen);
    const spOffsetStart = Math.max(0, spLen - minLen);

    const dates = spread.dates.slice(spOffsetStart);
    const spreadBps = spread.spread_bps.slice(spOffsetStart);
    const buyPressure = orderFlow.buy_pressure.slice(ofOffsetStart);

    // Ensure all arrays have the same length
    const len = Math.min(dates.length, spreadBps.length, buyPressure.length);
    const finalDates = dates.slice(-len);
    const finalSpreadBps = spreadBps.slice(-len);
    const finalBuyPressure = buyPressure.slice(-len);

    // Generate time indices for X-axis
    const timeIndices = Array.from({ length: len }, (_, i) => i);

    // Create color scale based on buy pressure
    const colors = finalBuyPressure.map((bp) =>
      bp > 0.3
        ? "#2ecc71" // Buy-dominated: green
        : bp < -0.3
        ? "#e74c3c" // Sell-dominated: red
        : "#f39c12" // Neutral: orange
    );

    return [
      {
        x: timeIndices,
        y: finalSpreadBps,
        z: finalBuyPressure,
        mode: "markers",
        marker: {
          size: 5,
          color: colors,
          opacity: 0.75,
          line: {
            width: 0.5,
            color: "rgba(255, 255, 255, 0.2)",
          },
        },
        text: finalDates.map(
          (date, i) =>
            `Date: ${date}\n` +
            `Spread: ${finalSpreadBps[i].toFixed(2)} bps\n` +
            `Pressure: ${finalBuyPressure[i].toFixed(4)}\n` +
            `${finalBuyPressure[i] > 0.3 ? "BUY" : finalBuyPressure[i] < -0.3 ? "SELL" : "NEUTRAL"}`
        ),
        hovertemplate: "%{text}<extra></extra>",
        type: "scatter3d",
      } as any,
    ];
  }, [orderFlow, spread]);

  const layout = {
    title: {
      text: title,
      font: { size: 14, color: "#e8a878", family: "JetBrains Mono" },
      x: 0.5,
      xanchor: "center",
    },
    scene: {
      xaxis: {
        title: "Time Period (index)",
        titlefont: { size: 11 },
        color: "#888",
        backgroundcolor: "rgba(58,58,92,0.05)",
        gridcolor: "rgba(58,58,92,0.15)",
        showbackground: true,
      },
      yaxis: {
        title: "Bid-Ask Spread (bps)",
        titlefont: { size: 11 },
        color: "#888",
        backgroundcolor: "rgba(58,58,92,0.05)",
        gridcolor: "rgba(58,58,92,0.15)",
        showbackground: true,
      },
      zaxis: {
        title: "Buy Pressure",
        titlefont: { size: 11 },
        color: "#888",
        backgroundcolor: "rgba(58,58,92,0.05)",
        gridcolor: "rgba(58,58,92,0.15)",
        showbackground: true,
      },
      camera: {
        eye: { x: 1.5, y: 1.5, z: 1.3 },
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
              filename: "order_flow_spread_3d",
              height: 700,
              width: 1000,
              scale: 2,
            },
          }}
          onHover={(data: any) => {
            if (data?.points?.[0]) {
              const point = data.points[0];
              const spread = point.y !== undefined ? point.y.toFixed(2) : "N/A";
              const pressure = point.z !== undefined ? point.z.toFixed(4) : "N/A";
              setHoverInfo(`Spread: ${spread} bps | Pressure: ${pressure}`);
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
