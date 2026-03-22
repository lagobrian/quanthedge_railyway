"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { API_BASE } from "@/lib/api";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function CryptoBreadthPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState({ dma50: true, dma100: true, dma200: true });

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/models/crypto-breadth/`)
      .then((res) => { if (!res.ok) throw new Error("Failed to fetch"); return res.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
  if (!data.length) return <div className="text-center py-20">No data available.</div>;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((d) => d.date);

  const traces: any[] = [];

  if (visible.dma50) {
    traces.push({
      x: dates,
      y: sorted.map((d) => d.pct_above_50dma),
      mode: "lines",
      name: "% Above 50 DMA",
      line: { width: 2, color: "#FF8C00" },
    });
  }
  if (visible.dma100) {
    traces.push({
      x: dates,
      y: sorted.map((d) => d.pct_above_100dma),
      mode: "lines",
      name: "% Above 100 DMA",
      line: { width: 2, color: "#00ced1" },
    });
  }
  if (visible.dma200) {
    traces.push({
      x: dates,
      y: sorted.map((d) => d.pct_above_200dma),
      mode: "lines",
      name: "% Above 200 DMA",
      line: { width: 2, color: "#b091cc" },
    });
  }

  const layout: any = {
    title: {
      text: "Crypto Breadth: % of Coins Above Key Moving Averages",
      font: { family: "Segoe UI, sans-serif", size: 18, color: "#ffffff" },
    },
    height: 650,
    paper_bgcolor: "#061829",
    plot_bgcolor: "#061829",
    font: { family: "Segoe UI, sans-serif", size: 12, color: "#ffffff" },
    xaxis: {
      title: "",
      showgrid: true,
      gridcolor: "#413510",
      showline: true,
      linecolor: "#413510",
      tickangle: -45,
      rangeslider: { visible: true, bgcolor: "#0a2438", bordercolor: "#413510" },
      rangeselector: {
        buttons: [
          { count: 1, label: "1M", step: "month", stepmode: "backward" },
          { count: 3, label: "3M", step: "month", stepmode: "backward" },
          { count: 6, label: "6M", step: "month", stepmode: "backward" },
          { count: 1, label: "1Y", step: "year", stepmode: "backward" },
          { count: 2, label: "2Y", step: "year", stepmode: "backward" },
          { step: "all", label: "All" },
        ],
        bgcolor: "#0a2438",
        activecolor: "#00ced1",
        bordercolor: "#413510",
        font: { color: "#ffffff" },
      },
    },
    yaxis: {
      title: { text: "% Above DMA", font: { size: 13 } },
      showgrid: true,
      gridcolor: "#413510",
      showline: true,
      linecolor: "#413510",
      zeroline: true,
      zerolinecolor: "#413510",
      range: [0, 100],
      ticksuffix: "%",
    },
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "right",
      x: 1,
      font: { size: 12 },
    },
    margin: { l: 60, r: 30, t: 60, b: 40 },
    hovermode: "x unified",
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"],
    toImageButtonOptions: {
      format: "png",
      filename: "crypto-breadth-chart",
      height: 800,
      width: 1200,
      scale: 3,
    },
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Crypto Breadth Model</h1>
      <p className="mb-8 text-center text-lg text-grey">
        This chart shows the percentage of cryptocurrencies trading above their 50, 100, and 200-day moving averages.
      </p>

      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {([
          { key: "dma50" as const, label: "50 DMA", color: "#FF8C00" },
          { key: "dma100" as const, label: "100 DMA", color: "#00ced1" },
          { key: "dma200" as const, label: "200 DMA", color: "#b091cc" },
        ]).map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border"
            style={{
              borderColor: color,
              backgroundColor: visible[key] ? color : "transparent",
              color: visible[key] ? "#061829" : color,
              opacity: visible[key] ? 1 : 0.5,
            }}
          >
            <span className="inline-block w-4 h-0.5 rounded-full" style={{ backgroundColor: visible[key] ? "#061829" : color }} />
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#061829" }}>
        <Plot
          data={traces}
          layout={layout}
          config={config}
          useResizeHandler
          style={{ width: "100%", height: "650px" }}
        />
      </div>
    </div>
  );
}
