"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getChartTheme, getBaseLayout, plotConfig, colors2 } from "@/lib/chartTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AltcoinIndexPage() {
  const [data, setData] = useState<any[]>([]);
  const [btcData, setBtcData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/models/crypto-index?index=alt100").then((r) => r.json()),
      fetch("/api/models/btc-prices").then((r) => r.json()),
    ])
      .then(([index, btc]) => {
        setData(Array.isArray(index) ? index : []);
        setBtcData(Array.isArray(btc) ? btc : []);
      })
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
  const btcSorted = [...btcData].sort((a, b) => a.date.localeCompare(b.date));
  const theme = getChartTheme();

  const traces: any[] = [
    // Altcoin index (green, filled)
    {
      x: dates,
      y: values,
      mode: "lines",
      name: "Altcoin 100 Index Price",
      line: { width: 2, color: colors2.bright_green },
      fill: "tonexty",
      fillcolor: "rgba(0, 255, 157, 0.1)",
    },
    // Bitcoin price overlay (white)
    {
      x: btcSorted.map((d) => d.date),
      y: btcSorted.map((d) => d.close),
      mode: "lines",
      name: "Bitcoin Price",
      line: { width: 2, color: "#ffffff" },
    },
  ];

  const baseLayout = getBaseLayout(theme, "Crypto 100 Altcoin Market-Cap Weighted Index (Excluding Stable Coins and Wrapped Coins)");
  const layout: any = {
    ...baseLayout,
    yaxis: {
      ...baseLayout.yaxis,
      title: { text: "Price ($)", font: { size: 13 } },
      zeroline: false,
      tickprefix: "$",
    },
    annotations: [
      {
        x: dates[dates.length - 1],
        y: values[values.length - 1],
        text: `$${values[values.length - 1]?.toFixed(2)}`,
        showarrow: false,
        yshift: -10,
        font: { size: 14, color: colors2.bright_green },
        xshift: 30,
      },
      ...(btcSorted.length > 0
        ? [{
            x: btcSorted[btcSorted.length - 1].date,
            y: btcSorted[btcSorted.length - 1].close,
            text: `$${btcSorted[btcSorted.length - 1].close.toFixed(2)}`,
            showarrow: false,
            yshift: -10,
            font: { size: 14, color: "#ffffff" },
            xshift: 30,
          }]
        : []),
    ],
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
      <div className="rounded-xl overflow-hidden" style={{ background: theme.paper_bgcolor }}>
        <Plot
          data={traces}
          layout={layout}
          config={{ ...plotConfig, toImageButtonOptions: { ...plotConfig.toImageButtonOptions, filename: "altcoin-100-index" } }}
          useResizeHandler
          style={{ width: "100%", height: "min(650px, 80vh)" }}
        />
      </div>
    </div>
  );
}
