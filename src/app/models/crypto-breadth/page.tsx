"use client";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useRef } from "react";

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

export default function CryptoBreadthPage() {
  // Dynamically import and register chartjs-plugin-zoom only on the client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('chartjs-plugin-zoom').then((mod) => {
        if (mod && mod.default) {
          ChartJS.register(mod.default);
        }
      });
    }
  }, []);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const chartRef = useRef<any>(null);
  // Date range state (initialized after data is loaded)
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [visible, setVisible] = useState({ dma50: true, dma100: true, dma200: true });

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/models/crypto-breadth/`)
      .then(res => { if (!res.ok) throw new Error("Failed to fetch"); return res.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Reverse data so earliest date is on the left
  const dataChron = [...data].reverse();

  // Set defaults after data is loaded
  useEffect(() => {
    if (dataChron.length && (!startDate || !endDate)) {
      setStartDate(dataChron[0].date);
      setEndDate(dataChron[dataChron.length - 1].date);
    }
  }, [dataChron]);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
  if (!data.length) return <div className="text-center py-20">No data available.</div>;
  if (!startDate || !endDate) return <div className="text-center py-20">Loading chart...</div>;

  // Filter data by date range
  const filteredData = dataChron.filter((d: any) => d.date >= startDate && d.date <= endDate);

  const allDatasets = [
    {
      key: 'dma50' as const,
      label: "% Above 50 DMA",
      data: filteredData.map((d: any) => d.pct_above_50dma),
      borderColor: "#FF8C00",
      backgroundColor: "rgba(255,140,0,0.08)",
      borderWidth: 2,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
    },
    {
      key: 'dma100' as const,
      label: "% Above 100 DMA",
      data: filteredData.map((d: any) => d.pct_above_100dma),
      borderColor: "#00ced1",
      backgroundColor: "rgba(0,206,209,0.08)",
      borderWidth: 2,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
    },
    {
      key: 'dma200' as const,
      label: "% Above 200 DMA",
      data: filteredData.map((d: any) => d.pct_above_200dma),
      borderColor: "#b091cc",
      backgroundColor: "rgba(176,145,204,0.08)",
      borderWidth: 2,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
    },
  ];

  const chartData = {
    labels: filteredData.map((d: any) => d.date),
    datasets: allDatasets.filter((ds) => visible[ds.key]),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Crypto Breadth: % of Coins Above Key Moving Averages",
        color: '#ffffff',
        font: { family: "'Segoe UI', sans-serif", size: 18, weight: 'bold' as const },
        padding: { bottom: 16 },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: 'rgba(6,24,41,0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#413510',
        borderWidth: 1,
        titleFont: { family: "'Segoe UI', sans-serif" },
        bodyFont: { family: "'Segoe UI', sans-serif" },
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}%`,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
        },
        zoom: {
          drag: true,
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy',
        },
        limits: {
          x: { minRange: 5 },
          y: { minRange: 20 },
        },
      },
    },
    interaction: { mode: "nearest" as const, axis: "x" as const, intersect: false },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "% Above DMA",
          color: '#ffffff',
          font: { family: "'Segoe UI', sans-serif", size: 13 },
        },
        grid: { color: '#413510', lineWidth: 0.7 },
        ticks: {
          color: '#ffffff',
          font: { family: "'Segoe UI', sans-serif", size: 11 },
          callback: (value: any) => `${value}%`,
        },
        border: { color: '#413510' },
      },
      x: {
        title: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 18,
          maxRotation: 45,
          color: '#ffffff',
          font: { family: "'Segoe UI', sans-serif", size: 11 },
        },
        grid: { color: '#413510', lineWidth: 0.7 },
        border: { color: '#413510' },
      },
    },
    layout: {
      padding: { top: 4, right: 16, bottom: 4, left: 8 },
    },
  };

  // Download handler with watermark
  const handleDownload = () => {
    // Get Chart.js instance from react-chartjs-2's Line ref
    const chartInstance = chartRef.current?.chart || chartRef.current?.ctx?.canvas;
    const canvas = chartInstance?.canvas || chartInstance;
    if (!canvas) return;

    // Create a temporary canvas to avoid drawing on the visible chart
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    // Fill background with #061829 to avoid transparency
    tempCtx.save();
    tempCtx.fillStyle = '#061829';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.restore();
    // Draw the chart onto the temporary canvas
    tempCtx.drawImage(canvas, 0, 0);

    // Draw watermark
    const text = 'Quant (h)Edge';
    tempCtx.save();
    tempCtx.font = 'bold 44px sans-serif';
    tempCtx.globalAlpha = 0.18;
    tempCtx.fillStyle = '#00ced1';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    // Diagonal watermark across chart
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate(-Math.PI / 6);
    tempCtx.fillText(text, 0, 0);
    tempCtx.restore();

    // Download the image
    const link = document.createElement('a');
    link.download = 'crypto-breadth-chart.png';
    link.href = tempCanvas.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Crypto Breadth Model</h1>
      <p className="mb-8 text-center text-lg text-grey">
        This chart shows the percentage of cryptocurrencies trading above their 50, 100, and 200-day moving averages.
      </p>
      <form className="flex flex-wrap gap-3 items-end mb-4 bg-[#0e2239]/60 rounded-xl px-4 py-3 shadow-inner border border-[#18324f]">
        <div className="flex flex-col min-w-[140px]">
          <label htmlFor="start-date" className="text-xs text-gray-300 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4 text-[#00ced1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            min={dataChron[0]?.date}
            max={endDate}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="rounded-lg bg-[#18324f]/80 text-white border border-[#00ced1] px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#00ced1] transition-all duration-150 placeholder:text-gray-400"
          />
        </div>
        <div className="flex flex-col min-w-[140px]">
          <label htmlFor="end-date" className="text-xs text-gray-300 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4 text-[#00ced1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            min={startDate}
            max={dataChron[dataChron.length-1]?.date}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="rounded-lg bg-[#18324f]/80 text-white border border-[#00ced1] px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#00ced1] transition-all duration-150 placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-end gap-2 ml-auto">
          {([
            { key: 'dma50' as const, label: '50 DMA', color: '#FF8C00' },
            { key: 'dma100' as const, label: '100 DMA', color: '#00ced1' },
            { key: 'dma200' as const, label: '200 DMA', color: '#b091cc' },
          ]).map(({ key, label, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border"
              style={{
                borderColor: color,
                backgroundColor: visible[key] ? color : 'transparent',
                color: visible[key] ? '#061829' : color,
                opacity: visible[key] ? 1 : 0.5,
              }}
            >
              <span
                className="inline-block w-3 h-0.5 rounded-full"
                style={{ backgroundColor: visible[key] ? '#061829' : color }}
              />
              {label}
            </button>
          ))}
          <button
            type="button"
            aria-label="Download Chart"
            className="p-2 rounded-full hover:bg-[#18324f] focus:outline-none focus:ring-2 focus:ring-[#00ced1] transition-all duration-150 border border-transparent text-[#00ced1] hover:text-[#b091cc] ml-2"
            onClick={handleDownload}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>
          </button>
        </div>
      </form>
      <div className="rounded-xl shadow p-6" style={{ background: '#061829' }}>
        <div style={{ height: '600px' }} onDoubleClick={() => chartRef.current?.chart?.resetZoom?.()}>
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
        <div className="text-xs text-gray-400 mt-2">Tip: Scroll or drag to zoom/pan. Double-click to reset.</div>
      </div>
    </div>
  );
}
