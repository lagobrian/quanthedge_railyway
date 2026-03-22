"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { API_BASE } from "@/lib/api";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AltcoinIndexPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/models/crypto-index/?index=alt100`)
      .then((res) => { if (!res.ok) throw new Error("Failed to fetch"); return res.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return <div className="text-center py-20">No index data available yet.</div>;

  const latest = sorted[sorted.length - 1];
  const dates = sorted.map((d) => d.date);
  const values = sorted.map((d) => d.value);

  const traces: any[] = [
    {
      x: dates,
      y: values,
      mode: "lines",
      name: "Altcoin 100 Index",
      line: { width: 2, color: "#00FF9D" },
      fill: "tonexty",
      fillcolor: "rgba(0, 255, 157, 0.1)",
    },
  ];

  const layout: any = {
    title: {
      text: "Altcoin 100 Market-Cap Weighted Index (Excl. BTC & Stablecoins)",
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
      title: { text: "Index Value", font: { size: 13 } },
      showgrid: true,
      gridcolor: "#413510",
      showline: true,
      linecolor: "#413510",
      zeroline: false,
      tickprefix: "$",
    },
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "right",
      x: 1,
    },
    margin: { l: 70, r: 30, t: 60, b: 40 },
    hovermode: "x unified",
    annotations: [
      {
        x: dates[dates.length - 1],
        y: values[values.length - 1],
        text: `$${values[values.length - 1]?.toFixed(2)}`,
        showarrow: false,
        yshift: -15,
        font: { size: 14, color: "#00FF9D" },
        xshift: 30,
      },
    ],
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"] as any[],
    toImageButtonOptions: {
      format: "png" as const,
      filename: "altcoin-100-index",
      height: 800,
      width: 1200,
      scale: 3,
    },
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2 text-center">Altcoin 100 Index</h1>
      <p className="mb-4 text-center text-lg text-grey">
        Market-cap weighted index of the top 100 altcoins, excluding Bitcoin and stablecoins. Rebalanced monthly.
      </p>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-6 justify-center mb-8">
        <div className="bg-[#0e2239]/60 rounded-xl px-6 py-3 border border-[#18324f] text-center">
          <div className="text-xs text-gray-400">Current Value</div>
          <div className="text-2xl font-bold text-[#00FF9D]">{latest.value.toFixed(2)}</div>
        </div>
        {latest.daily_return != null && (
          <div className="bg-[#0e2239]/60 rounded-xl px-6 py-3 border border-[#18324f] text-center">
            <div className="text-xs text-gray-400">Daily Return</div>
            <div className={`text-2xl font-bold ${latest.daily_return >= 0 ? "text-[#00FF9D]" : "text-red-400"}`}>
              {latest.daily_return >= 0 ? "+" : ""}{latest.daily_return.toFixed(2)}%
            </div>
          </div>
        )}
        {latest.num_constituents && (
          <div className="bg-[#0e2239]/60 rounded-xl px-6 py-3 border border-[#18324f] text-center">
            <div className="text-xs text-gray-400">Constituents</div>
            <div className="text-2xl font-bold text-white">{latest.num_constituents}</div>
          </div>
        )}
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
