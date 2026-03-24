'use client';

import { useState, useEffect, use } from 'react';
import dynamic from 'next/dynamic';
import { API_BASE } from '@/lib/api';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Backtest {
  id: number;
  name: string;
  slug: string;
  description: string;
  instrument: string;
  model_name: string | null;
  start_date: string;
  end_date: string;
  parameters: Record<string, any>;
  total_return_pct: number | null;
  benchmark_return_pct: number | null;
  sharpe_ratio: number | null;
  max_drawdown_pct: number | null;
  max_drawdown_duration_days: number | null;
  win_rate_pct: number | null;
  total_trades: number | null;
  avg_trade_duration_days: number | null;
  avg_winning_trade_pct: number | null;
  avg_losing_trade_pct: number | null;
  best_trade_pct: number | null;
  worst_trade_pct: number | null;
  profit_factor: number | null;
  expectancy: number | null;
  start_value: number | null;
  end_value: number | null;
  heatmap_data: { x_labels: number[]; y_labels: number[]; values: number[][] } | null;
  heatmap_x_label: string;
  heatmap_y_label: string;
  equity_curve: [string, number][];
  drawdown_curve: [string, number][];
  trades: Trade[];
}

interface Trade {
  entry_date: string;
  exit_date: string;
  direction: string;
  return_pct: number;
  pnl: number | null;
  duration_days: number | null;
}

export default function BacktestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [bt, setBt] = useState<Backtest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllTrades, setShowAllTrades] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/models/backtests/${slug}/`)
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then(setBt)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-center py-20">Loading backtest...</div>;
  if (error || !bt) return <div className="text-center py-20 text-destructive">{error || 'Not found'}</div>;

  const statCard = (label: string, value: string | number | null, color?: string) => (
    <div className="card text-center">
      <div className={`text-2xl font-bold ${color || 'text-foreground'}`}>
        {value ?? '—'}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );

  const visibleTrades = showAllTrades ? bt.trades : bt.trades.slice(0, 20);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{bt.name}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>Instrument: <strong className="text-foreground">{bt.instrument}</strong></span>
          <span>·</span>
          <span>{bt.start_date} → {bt.end_date}</span>
          {bt.model_name && <><span>·</span><span>Model: <strong className="text-primary">{bt.model_name}</strong></span></>}
        </div>
        {bt.description && <p className="text-muted-foreground mt-3">{bt.description}</p>}
      </div>

      {/* Key stats headline */}
      {bt.start_value != null && bt.end_value != null && (
        <div className="card mb-8 text-center py-6">
          <p className="text-lg text-muted-foreground">
            <strong className="text-foreground">${bt.start_value.toFixed(0)}</strong> invested on {bt.start_date} would be worth{' '}
            <strong className={bt.end_value >= bt.start_value ? 'text-green-400' : 'text-red-400'}>
              ${bt.end_value.toFixed(2)}
            </strong>{' '}
            by {bt.end_date}
          </p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {statCard('Total Return', bt.total_return_pct != null ? `${bt.total_return_pct >= 0 ? '+' : ''}${bt.total_return_pct.toFixed(1)}%` : null,
          bt.total_return_pct != null ? (bt.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400') : undefined)}
        {statCard('Benchmark', bt.benchmark_return_pct != null ? `${bt.benchmark_return_pct.toFixed(1)}%` : null)}
        {statCard('Sharpe Ratio', bt.sharpe_ratio?.toFixed(2) ?? null)}
        {statCard('Max Drawdown', bt.max_drawdown_pct != null ? `${bt.max_drawdown_pct.toFixed(1)}%` : null, 'text-red-400')}
        {statCard('Win Rate', bt.win_rate_pct != null ? `${bt.win_rate_pct.toFixed(1)}%` : null)}
        {statCard('Profit Factor', bt.profit_factor?.toFixed(2) ?? null)}
      </div>

      {/* Detailed stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {statCard('Total Trades', bt.total_trades)}
        {statCard('Avg Duration', bt.avg_trade_duration_days != null ? `${bt.avg_trade_duration_days.toFixed(0)}d` : null)}
        {statCard('Best Trade', bt.best_trade_pct != null ? `+${bt.best_trade_pct.toFixed(1)}%` : null, 'text-green-400')}
        {statCard('Worst Trade', bt.worst_trade_pct != null ? `${bt.worst_trade_pct.toFixed(1)}%` : null, 'text-red-400')}
        {statCard('Avg Winner', bt.avg_winning_trade_pct != null ? `+${bt.avg_winning_trade_pct.toFixed(1)}%` : null, 'text-green-400')}
        {statCard('Avg Loser', bt.avg_losing_trade_pct != null ? `${bt.avg_losing_trade_pct.toFixed(1)}%` : null, 'text-red-400')}
      </div>

      {/* Threshold Optimization Heatmap */}
      {bt.heatmap_data && (
        <div className="rounded-xl overflow-hidden mb-8" style={{ background: 'var(--chart-bg, #061829)' }}>
          <Plot
            data={[{
              x: bt.heatmap_data.x_labels,
              y: bt.heatmap_data.y_labels,
              z: bt.heatmap_data.values,
              type: 'heatmap',
              colorscale: 'RdBu',
              text: bt.heatmap_data.values.map(row => row.map(v => `${v.toFixed(1)}%`)),
              texttemplate: '%{text}',
              hovertemplate: `${bt.heatmap_x_label || 'Long'}: %{x}<br>${bt.heatmap_y_label || 'Short'}: %{y}<br>Return: %{z:.1f}%<extra></extra>`,
            } as any]}
            layout={{
              title: { text: 'Threshold Optimization: Returns by Entry/Exit Levels', font: { size: 16, color: 'var(--chart-text, #fff)' } },
              autosize: true,
              paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: 'var(--chart-text, #fff)', size: 11 },
              xaxis: { title: bt.heatmap_x_label || 'Long Threshold', gridcolor: 'var(--chart-grid, #413510)' },
              yaxis: { title: bt.heatmap_y_label || 'Short Threshold', gridcolor: 'var(--chart-grid, #413510)' },
              margin: { l: 80, r: 30, t: 50, b: 60 },
            }}
            config={{ displayModeBar: false }}
            useResizeHandler
            style={{ width: '100%', height: 'min(500px, 60vh)' }}
          />
        </div>
      )}

      {/* Equity Curve */}
      {bt.equity_curve.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-8" style={{ background: 'var(--chart-bg, #061829)' }}>
          <Plot
            data={[{
              x: bt.equity_curve.map(p => p[0]),
              y: bt.equity_curve.map(p => p[1]),
              mode: 'lines',
              name: 'Portfolio Value',
              line: { width: 2, color: '#00FF9D' },
              fill: 'tonexty',
              fillcolor: 'rgba(0, 255, 157, 0.08)',
            }]}
            layout={{
              title: { text: 'Equity Curve', font: { size: 16, color: 'var(--chart-text, #fff)' } },
              autosize: true,
              paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: 'var(--chart-text, #fff)', size: 11 },
              xaxis: { showgrid: true, gridcolor: 'var(--chart-grid, #413510)', rangeslider: { visible: true } },
              yaxis: { showgrid: true, gridcolor: 'var(--chart-grid, #413510)', tickprefix: '$' },
              margin: { l: 60, r: 20, t: 40, b: 40 },
              hovermode: 'x unified',
            }}
            config={{ displayModeBar: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] as any[] }}
            useResizeHandler
            style={{ width: '100%', height: 'min(500px, 60vh)' }}
          />
        </div>
      )}

      {/* Drawdown Curve */}
      {bt.drawdown_curve.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-8" style={{ background: 'var(--chart-bg, #061829)' }}>
          <Plot
            data={[{
              x: bt.drawdown_curve.map(p => p[0]),
              y: bt.drawdown_curve.map(p => p[1]),
              mode: 'lines',
              name: 'Drawdown',
              line: { width: 2, color: '#ff2400' },
              fill: 'tonexty',
              fillcolor: 'rgba(255, 36, 0, 0.08)',
            }]}
            layout={{
              title: { text: 'Drawdown', font: { size: 16, color: 'var(--chart-text, #fff)' } },
              autosize: true,
              paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: 'var(--chart-text, #fff)', size: 11 },
              xaxis: { showgrid: true, gridcolor: 'var(--chart-grid, #413510)' },
              yaxis: { showgrid: true, gridcolor: 'var(--chart-grid, #413510)', ticksuffix: '%' },
              margin: { l: 60, r: 20, t: 40, b: 40 },
            }}
            config={{ displayModeBar: false }}
            useResizeHandler
            style={{ width: '100%', height: 'min(300px, 40vh)' }}
          />
        </div>
      )}

      {/* Trades Table */}
      {bt.trades.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="text-lg font-bold mb-4">
            Trades <span className="text-muted-foreground font-normal">({bt.trades.length})</span>
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3">Entry</th>
                <th className="text-left py-2 px-3">Exit</th>
                <th className="text-left py-2 px-3">Direction</th>
                <th className="text-right py-2 px-3">Return</th>
                <th className="text-right py-2 px-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {visibleTrades.map((t, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 px-3">{new Date(t.entry_date).toLocaleDateString()}</td>
                  <td className="py-2 px-3">{new Date(t.exit_date).toLocaleDateString()}</td>
                  <td className="py-2 px-3">
                    <span className={t.direction === 'long' ? 'text-green-400' : 'text-red-400'}>
                      {t.direction === 'long' ? '↑ Long' : '↓ Short'}
                    </span>
                  </td>
                  <td className={`py-2 px-3 text-right font-mono ${t.return_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.return_pct >= 0 ? '+' : ''}{t.return_pct.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-right text-muted-foreground">
                    {t.duration_days != null ? `${t.duration_days.toFixed(0)}d` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bt.trades.length > 20 && !showAllTrades && (
            <button
              onClick={() => setShowAllTrades(true)}
              className="mt-4 w-full py-2 text-sm text-primary border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Show all {bt.trades.length} trades
            </button>
          )}
        </div>
      )}

      {/* Parameters */}
      {bt.parameters && Object.keys(bt.parameters).length > 0 && (
        <div className="card mt-8">
          <h3 className="text-lg font-bold mb-3">Parameters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(bt.parameters).map(([k, v]) => (
              <div key={k} className="text-sm">
                <span className="text-muted-foreground">{k}:</span>{' '}
                <strong>{String(v)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
