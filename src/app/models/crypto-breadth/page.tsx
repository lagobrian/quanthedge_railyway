"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getChartTheme, getBaseLayout, plotConfig, colors2 } from "@/lib/chartTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function CryptoBreadthPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/models/crypto-breadth")
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
  const theme = getChartTheme();

  const traces: any[] = [
    {
      x: dates,
      y: sorted.map((d) => d.pct_above_50dma),
      mode: "lines",
      name: "% Above 50 DMA",
      line: { width: 2, color: colors2.orange },
    },
    {
      x: dates,
      y: sorted.map((d) => d.pct_above_100dma),
      mode: "lines",
      name: "% Above 100 DMA",
      line: { width: 2, color: colors2.blue },
    },
    {
      x: dates,
      y: sorted.map((d) => d.pct_above_200dma),
      mode: "lines",
      name: "% Above 200 DMA",
      line: { width: 2, color: colors2.purple },
    },
  ];

  const layout: any = {
    ...getBaseLayout(theme, "Crypto Breadth: % of Coins Above Key Moving Averages"),
    yaxis: {
      title: { text: "% Above DMA", font: { size: 13 } },
      showgrid: true,
      gridcolor: theme.gridcolor,
      showline: true,
      linecolor: theme.gridcolor,
      zeroline: true,
      zerolinecolor: theme.gridcolor,
      range: [0, 100],
      ticksuffix: "%",
    },
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Crypto Breadth Model</h1>
      <p className="mb-8 text-center text-lg text-grey">
        This chart shows the percentage of cryptocurrencies trading above their 50, 100, and 200-day moving averages.
      </p>

      <div className="rounded-xl overflow-hidden" style={{ background: theme.paper_bgcolor }}>
        <Plot
          data={traces}
          layout={layout}
          config={{ ...plotConfig, toImageButtonOptions: { ...plotConfig.toImageButtonOptions, filename: "crypto-breadth-chart" } }}
          useResizeHandler
          style={{ width: "100%", height: "min(650px, 80vh)" }}
        />
      </div>
    </div>
  );
}
