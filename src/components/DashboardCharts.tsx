import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Analytics {
  monthly_views: { month: string; views: number }[];
  monthly_likes: { month: string; likes: number }[];
  monthly_comments: { month: string; comments: number }[];
  category_distribution: { category: string; count: number }[];
  top_posts: any[];
}

interface DashboardChartsProps {
  analytics: Analytics | null | undefined;
}

export default function DashboardCharts({ analytics }: DashboardChartsProps) {
  // Loading/empty state
  if (!analytics || !analytics.monthly_views || analytics.monthly_views.length === 0) {
    return (
      <div className="my-8 text-center text-gray-500 dark:text-gray-300">
        <div className="bg-white/90 dark:bg-slate-900 rounded-2xl shadow-xl p-8 inline-block">
          <span className="text-lg">No analytics data available yet.</span>
        </div>
      </div>
    );
  }

  // Monthly Trends
  const months = analytics.monthly_views?.map((d) => d.month) || [];
  const views = analytics.monthly_views?.map((d) => d.views) || [];
  const likes = analytics.monthly_likes?.map((d) => d.likes) || [];
  const comments = analytics.monthly_comments?.map((d) => d.comments) || [];

  const trendData = {
    labels: months,
    datasets: [
      {
        type: 'bar' as const,
        label: "Views",
        data: views,
        backgroundColor: "#2563eb88",
        borderColor: "#2563eb",
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: "Likes",
        data: likes,
        borderColor: "#06b6d4",
        backgroundColor: "#06b6d422",
        tension: 0.35,
        fill: false,
        yAxisID: 'y1',
      },
      {
        type: 'line' as const,
        label: "Comments",
        data: comments,
        borderColor: "#f59e42",
        backgroundColor: "#f59e4233",
        tension: 0.35,
        fill: false,
        yAxisID: 'y2',
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Monthly Trends', font: { size: 18 } },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Views' } },
      y1: { beginAtZero: true, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'Likes' } },
      y2: { beginAtZero: true, position: 'right' as const, grid: { drawOnChartArea: false }, title: { display: true, text: 'Comments' } },
    },
  };

  // Category Pie
  const catLabels = analytics.category_distribution?.map((d) => d.category) || [];
  const catCounts = analytics.category_distribution?.map((d) => d.count) || [];
  const categoryData = {
    labels: catLabels,
    datasets: [
      {
        data: catCounts,
        backgroundColor: [
          "#2563eb",
          "#06b6d4",
          "#f59e42",
          "#f43f5e",
          "#22d3ee",
          "#a78bfa",
        ],
        borderWidth: 1,
      },
    ],
  };

  const categoryOptions = {
    plugins: {
      legend: { position: 'right' as const },
      title: { display: true, text: 'Category Distribution', font: { size: 18 } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed} posts` } },
    },
    cutout: '65%',
    animation: { animateRotate: true, animateScale: true },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
      <div className="bg-white/90 dark:bg-slate-900 rounded-2xl shadow-xl p-6">
        <Chart
          type="bar"
          data={trendData}
          options={trendOptions}
          aria-label="Monthly trends: views, likes, comments"
          role="img"
        />
      </div>
      <div className="bg-white/90 dark:bg-slate-900 rounded-2xl shadow-xl p-6 flex items-center justify-center">
        <Doughnut
          data={categoryData}
          options={categoryOptions}
          style={{ maxWidth: 340 }}
          aria-label="Category distribution"
          role="img"
        />
      </div>
    </div>
  );
}
