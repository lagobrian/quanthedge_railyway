"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getChartTheme, getBaseLayout, plotConfig, colors2 } from "@/lib/chartTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function GlobalMetricsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/models/crypto-global")
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
  const theme = getChartTheme();

  const traces: any[] = [
    {
      x: dates,
      y: sorted.map((d) => d.btc_dominance),
      mode: "lines",
      name: "BTC Dominance",
      line: { width: 2, color: colors2.orange },
      yaxis: "y",
    },
    {
      x: dates,
      y: sorted.map((d) => d.eth_dominance),
      mode: "lines",
      name: "ETH Dominance",
      line: { width: 2, color: colors2.blue },
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
      line: { width: 1.5, color: colors2.bright_green },
      yaxis: "y2",
    });
  }

  const baseLayout = getBaseLayout(theme, "BTC Dominance & Global Crypto Metrics");
  const layout: any = {
    ...baseLayout,
    yaxis: {
      ...baseLayout.yaxis,
      title: { text: "Dominance %", font: { size: 13 } },
      ticksuffix: "%",
    },
    yaxis2: {
      title: { text: "Total Market Cap", font: { size: 13 } },
      overlaying: "y",
      side: "right",
      showgrid: false,
      tickprefix: "$",
    },
    margin: { l: 60, r: 70, t: 60, b: 40 },
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
            <div className="text-2xl font-bold" style={{ color: colors2.orange }}>{latest.btc_dominance.toFixed(1)}%</div>
          </div>
        )}
        {latest.eth_dominance != null && (
          <div className="bg-[#0e2239]/60 rounded-xl px-6 py-3 border border-[#18324f] text-center">
            <div className="text-xs text-gray-400">ETH Dominance</div>
            <div className="text-2xl font-bold" style={{ color: colors2.blue }}>{latest.eth_dominance.toFixed(1)}%</div>
          </div>
        )}
        {latest.total_market_cap != null && (
          <div className="bg-[#0e2239]/60 rounded-xl px-6 py-3 border border-[#18324f] text-center">
            <div className="text-xs text-gray-400">Total Market Cap</div>
            <div className="text-2xl font-bold" style={{ color: colors2.bright_green }}>{formatNum(latest.total_market_cap)}</div>
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
      <div className="rounded-xl overflow-hidden" style={{ background: theme.paper_bgcolor }}>
        <Plot
          data={traces}
          layout={layout}
          config={{ ...plotConfig, toImageButtonOptions: { ...plotConfig.toImageButtonOptions, filename: "global-crypto-metrics" } }}
          useResizeHandler
          style={{ width: "100%", height: "min(650px, 80vh)" }}
        />
      </div>
    </div>
  );
}
