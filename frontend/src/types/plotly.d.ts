declare module 'react-plotly.js' {
  import type React from 'react';

  interface PlotParams {
    data: any[];
    layout?: any;
    frames?: any[];
    config?: any;
    onInitialized?: (figure: any, graphDiv: any) => void;
    onUpdate?: (figure: any, graphDiv: any) => void;
    onPurge?: (graphDiv: any) => void;
    onError?: (err: any) => void;
    onHover?: (data: any) => void;
    onClick?: (data: any) => void;
    onUnhover?: (data: any) => void;
    divId?: string;
    className?: string;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    debug?: boolean;
    revision?: number;
  }

  const Plot: React.FC<PlotParams>;
  export default Plot;
}
