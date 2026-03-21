"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import React from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Dummy data for the card preview
const data = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "% Above 50DMA",
      data: [60, 65, 62, 68, 70, 72, 74],
      borderColor: "#60A5FA",
      backgroundColor: "rgba(96,165,250,0.2)",
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    },
    {
      label: "% Above 200DMA",
      data: [40, 43, 44, 46, 48, 51, 53],
      borderColor: "#A78BFA",
      backgroundColor: "rgba(167,139,250,0.2)",
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: { enabled: false },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
      min: 0,
      max: 100,
    },
  },
  elements: {
    line: { borderWidth: 2 },
    point: { radius: 0 },
  },
};

export default function CryptoBreadthCardChart() {
  return (
    <div style={{ width: "100%", height: 140 }}>
      <Line data={data} options={options} />
    </div>
  );
}
