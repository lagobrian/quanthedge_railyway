"use client";
import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { API_BASE } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend);

export default function AltcoinIndexPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("chartjs-plugin-zoom").then((mod) => {
        if (mod?.default) ChartJS.register(mod.default);
      });
    }
  }, []);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const chartRef = useRef<any>(null);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/models/crypto-index/?index=alt100`)
      .then(res => { if (!res.ok) throw new Error("Failed to fetch"); return res.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  useEffect(() => {
    if (sorted.length && (!startDate || !endDate)) {
      setStartDate(sorted[0].date);
      setEndDate(sorted[sorted.length - 1].date);
    }
  }, [sorted.length]);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
  if (!sorted.length) return <div className="text-center py-20">No index data available yet. Run the data pipeline first.</div>;
  if (!startDate || !endDate) return <div className="text-center py-20">Loading chart...</div>;

  const filteredData = sorted.filter((d) => d.date >= startDate && d.date <= endDate);
  const latest = filteredData[filteredData.length - 1] || sorted[sorted.length - 1];

  const chartData = {
    labels: filteredData.map((d) => d.date),
    datasets: [
      {
        label: "Altcoin 100 Index",
        data: filteredData.map((d) => d.value),
        borderColor: "#00FF9D",
        backgroundColor: "rgba(0,255,157,0.1)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Altcoin 100 Market-Cap Weighted Index (Excl. BTC & Stablecoins)",
        color: "#ffffff",
        font: { family: "'Segoe UI', sans-serif", size: 18, weight: "bold" as const },
        padding: { bottom: 16 },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(6,24,41,0.95)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#413510",
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => ` Index: ${ctx.parsed.y?.toFixed(2)}`,
        },
      },
      zoom: {
        pan: { enabled: true, mode: "xy" as const },
        zoom: { drag: { enabled: true }, wheel: { enabled: true }, pinch: { enabled: true }, mode: "xy" as const },
      },
    },
    scales: {
      y: {
        title: { display: true, text: "Index Value", color: "#ffffff", font: { size: 13 } },
        grid: { color: "#413510", lineWidth: 0.7 },
        ticks: { color: "#ffffff", font: { size: 11 } },
        border: { color: "#413510" },
      },
      x: {
        ticks: { maxTicksLimit: 18, maxRotation: 45, color: "#ffffff", font: { size: 11 } },
        grid: { color: "#413510", lineWidth: 0.7 },
        border: { color: "#413510" },
      },
    },
    layout: { padding: { top: 4, right: 16, bottom: 4, left: 8 } },
  };

  const handleDownload = () => {
    const chartInstance = chartRef.current?.chart || chartRef.current?.ctx?.canvas;
    const canvas = chartInstance?.canvas || chartInstance;
    if (!canvas) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;
    tempCtx.fillStyle = "#061829";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    tempCtx.save();
    tempCtx.font = "bold 44px sans-serif";
    tempCtx.globalAlpha = 0.18;
    tempCtx.fillStyle = "#00ced1";
    tempCtx.textAlign = "center";
    tempCtx.textBaseline = "middle";
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate(-Math.PI / 6);
    tempCtx.fillText("Quant (h)Edge", 0, 0);
    tempCtx.restore();
    const link = document.createElement("a");
    link.download = "altcoin-100-index.png";
    link.href = tempCanvas.toDataURL("image/png", 1.0);
    link.click();
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

      {/* Toolbar: date pickers + download */}
      <form className="flex flex-wrap gap-3 items-end mb-4 bg-[#0e2239]/60 rounded-xl px-4 py-3 shadow-inner border border-[#18324f]">
        <div className="flex flex-col min-w-[140px]">
          <label htmlFor="start-date" className="text-xs text-gray-300 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4 text-[#00FF9D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Start Date
          </label>
          <input id="start-date" type="date" min={sorted[0]?.date} max={endDate} value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg bg-[#18324f]/80 text-white border border-[#00FF9D] px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#00FF9D] transition-all duration-150"
          />
        </div>
        <div className="flex flex-col min-w-[140px]">
          <label htmlFor="end-date" className="text-xs text-gray-300 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4 text-[#00FF9D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            End Date
          </label>
          <input id="end-date" type="date" min={startDate} max={sorted[sorted.length - 1]?.date} value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg bg-[#18324f]/80 text-white border border-[#00FF9D] px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#00FF9D] transition-all duration-150"
          />
        </div>
        <div className="flex items-end gap-2 ml-auto">
          <button type="button" aria-label="Download Chart"
            className="p-2 rounded-full hover:bg-[#18324f] focus:outline-none focus:ring-2 focus:ring-[#00FF9D] transition-all duration-150 border border-transparent text-[#00FF9D] hover:text-[#b091cc]"
            onClick={handleDownload}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>
          </button>
        </div>
      </form>

      <div className="rounded-xl shadow p-6" style={{ background: "#061829" }}>
        <div style={{ height: "600px" }} onDoubleClick={() => chartRef.current?.chart?.resetZoom?.()}>
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
        <div className="text-xs text-gray-400 mt-2">Tip: Scroll or drag to zoom/pan. Double-click to reset.</div>
      </div>
    </div>
  );
}
