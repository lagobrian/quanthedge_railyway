"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { API_BASE } from "@/lib/api";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function GlobalMetricsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/models/crypto-global/`)
      .then((res) => { if (!res.ok) throw new Error("Failed to fetch"); return res.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return <div className="text-center py-20">No global metrics data available yet.</div>;

  const latest = sorted[sorted.length - 1];
  const dates = sorted.map((d) => d.date);

  const traces: any[] = [
    {
      x: dates,
      y: sorted.map((d) => d.btc_dominance),
      mode: "lines",
      name: "BTC Dominance",
      line: { width: 2, color: "#FF8C00" },
      yaxis: "y",
    },
    {
      x: dates,
      y: sorted.map((d) => d.eth_dominance),
      mode: "lines",
      name: "ETH Dominance",
      line: { width: 2, color: "#00ced1" },
      yaxis: "y",
    },
  ];

  // Add total market cap on secondary axis if available
  if (sorted.some((d) => d.total_market_cap)) {
    traces.push({
      x: dates,
      y: sorted.map((d) => d.total_market_cap),
      mode: "lines",
      name: "Total Market Cap",
      line: { width: 1.5, color: "#00FF9D" },
      yaxis: "y2",
    });
  }

  const layout: any = {
    title: {
      text: "BTC Dominance & Global Crypto Metrics",
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
          { step: "all", label: "All" },
        ],
        bgcolor: "#0a2438",
        activecolor: "#00ced1",
        bordercolor: "#413510",
        font: { color: "#ffffff" },
      },
    },
    yaxis: {
      title: { text: "Dominance %", font: { size: 13 } },
      showgrid: true,
      gridcolor: "#413510",
      showline: true,
      linecolor: "#413510",
      ticksuffix: "%",
    },
    yaxis2: {
      title: { text: "Total Market Cap", font: { size: 13 } },
      overlaying: "y",
      side: "right",
      showgrid: false,
      tickprefix: "$",
    },
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "right",
      x: 1,
    },
    margin: { l: 60, r: 70, t: 60, b: 40 },
    hovermode: "x unified",
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"] as any[],
    toImageButtonOptions: {
      format: "png" as const,
      filename: "global-crypto-metrics",
      height: 800,
      width: 1200,
      scale: 3,
    },
  };

  const formatNum = (n: number | null) => {
    if (!n) return "N/A";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2 text-center">BTC Dominance & Global Metrics</h1>
      <p className="mb-4 text-center text-lg text-grey">
        Track Bitcoin dominance, total market cap, and global crypto market metrics over time.
      </p>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-6 justify-center mb-8">
        {latest.btc_dominance != null && (
          <div className="bg-[#0e2239]/60 rounded-xl px-6 py-3 border border-[#18324f] text-center">
            <div className="text-xs text-gray-400">BTC Dominance</div>
            <div className="text-2xl font-bold text-[#FF8C00]">{latest.btc_dominance.toFixed(1)}%</div>
          </div>
        )}
        {latest.eth_dominance != null && (
          <div className="bg-[#0e2239]/60 rounded-xl px-6 py-3 border border-[#18324f] text-center">
            <div className="text-xs text-gray-400">ETH Dominance</div>
            <div className="text-2xl font-bold text-[#00ced1]">{latest.eth_dominance.toFixed(1)}%</div>
          </div>
        )}
        {latest.total_market_cap != null && (
          <div className="bg-[#0e2239]/60 rounded-xl px-6 py-3 border border-[#18324f] text-center">
            <div className="text-xs text-gray-400">Total Market Cap</div>
            <div className="text-2xl font-bold text-[#00FF9D]">{formatNum(latest.total_market_cap)}</div>
          </div>
        )}
        {latest.active_cryptocurrencies != null && (
          <div className="bg-[#0e2239]/60 rounded-xl px-6 py-3 border border-[#18324f] text-center">
            <div className="text-xs text-gray-400">Active Coins</div>
            <div className="text-2xl font-bold text-white">{latest.active_cryptocurrencies.toLocaleString()}</div>
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
