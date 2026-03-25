'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getChartTheme, colors2, plotConfig } from '@/lib/chartTheme';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface OHLCChartProps {
  data: OHLCData[];
  title: string;
  livePrice?: number | null;
  height?: number;
  tickprefix?: string;
}

export default function OHLCChart({ data, title, livePrice, height = 500, tickprefix = '$' }: OHLCChartProps) {
  const theme = getChartTheme();

  const chartData = useMemo(() => {
    if (!data.length) return null;

    const dates = data.map((d) => d.date);
    const open = data.map((d) => d.open);
    const high = data.map((d) => d.high);
    const low = data.map((d) => d.low);
    const close = data.map((d) => d.close);

    return { dates, open, high, low, close };
  }, [data]);

  if (!chartData) return null;

  const { dates, open, high, low, close } = chartData;
  const latestClose = close[close.length - 1];
  const prevClose = close.length > 1 ? close[close.length - 2] : latestClose;
  const displayPrice = livePrice ?? latestClose;
  const pctChange = prevClose > 0 ? ((displayPrice - prevClose) / prevClose) * 100 : 0;

  const traces: any[] = [
    {
      x: dates,
      open,
      high,
      low,
      close,
      type: 'candlestick',
      name: title,
      increasing: { line: { color: colors2.bright_green, width: 1 }, fillcolor: colors2.bright_green },
      decreasing: { line: { color: colors2.red, width: 1 }, fillcolor: colors2.red },
    },
  ];

  const layout: any = {
    autosize: true,
    uirevision: 'keep', // preserve zoom/pan state across re-renders
    paper_bgcolor: theme.paper_bgcolor,
    plot_bgcolor: theme.plot_bgcolor,
    font: { family: theme.fontFamily, size: 11, color: theme.fontColor },
    margin: { l: 55, r: 15, t: 10, b: 5 },
    showlegend: false,
    hovermode: 'x',
    xaxis: {
      showgrid: true,
      gridcolor: theme.gridcolor,
      showline: true,
      linecolor: theme.gridcolor,
      tickfont: { size: 9 },
      rangeslider: {
        visible: true,
        thickness: 0.06,
        bgcolor: theme.rangesliderBg,
        bordercolor: theme.bordercolor,
        borderwidth: 1,
      },
      rangeselector: {
        buttons: [
          { count: 1, label: '1M', step: 'month', stepmode: 'backward' },
          { count: 3, label: '3M', step: 'month', stepmode: 'backward' },
          { count: 6, label: '6M', step: 'month', stepmode: 'backward' },
          { count: 1, label: '1Y', step: 'year', stepmode: 'backward' },
          { step: 'all', label: 'All' },
        ],
        bgcolor: theme.rangeselectorBg,
        activecolor: theme.rangeselectorActive,
        bordercolor: theme.bordercolor,
        font: { color: theme.fontColor, size: 9 },
        y: 1.05,
      },
    },
    yaxis: {
      showgrid: true,
      gridcolor: theme.gridcolor,
      showline: true,
      linecolor: theme.gridcolor,
      tickprefix,
      side: 'right',
      tickfont: { size: 10 },
      fixedrange: false, // allow y-axis zoom
    },
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: theme.bordercolor, background: theme.paper_bgcolor }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${theme.bordercolor}` }}>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold" style={{ color: theme.fontColor }}>{title}</span>
          {livePrice != null && (
            <span className="flex items-center gap-1 text-xs" style={{ color: colors2.bright_green }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: theme.fontColor }}>
            {tickprefix}{displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: pctChange >= 0 ? colors2.bright_green : colors2.red }}
          >
            {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <Plot
        data={traces}
        layout={layout}
        config={{ ...plotConfig, displayModeBar: true, scrollZoom: true }}
        useResizeHandler
        style={{ width: '100%', height: height - 60 }}
      />
    </div>
  );
}
