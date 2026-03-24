'use client';

import { useState, useEffect, use } from 'react';
import dynamic from 'next/dynamic';
import { API_BASE } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface QuantModel {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  methodology: string;
  how_to_trade: string;
  asset_class: string;
  frequency: string;
  data_source: string;
  is_premium: boolean;
  current_signal: string | null;
  current_value: number | null;
  last_updated: string;
  page_url: string;
  signal_results: SignalResult[];
}

interface SignalResult {
  signal_type: string;
  interval_label: string;
  interval_days: number;
  avg_return_pct: number;
  hit_rate_pct: number;
  sample_size: number;
}

interface DataPoint {
  timestamp: string;
  value: number;
  signal: string | null;
  metadata: Record<string, any>;
}

const signalBadge = (signal: string | null) => {
  if (!signal) return null;
  const colors: Record<string, string> = {
    bullish: 'bg-green-500/20 text-green-400 border-green-500/30',
    bearish: 'bg-red-500/20 text-red-400 border-red-500/30',
    neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const emojis: Record<string, string> = { bullish: '🟢', bearish: '🔴', neutral: '⚪' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium ${colors[signal] || colors.neutral}`}>
      {emojis[signal] || '⚪'} {signal.charAt(0).toUpperCase() + signal.slice(1)}
    </span>
  );
};

export default function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAppSelector((state) => state.auth);
  const [model, setModel] = useState<QuantModel | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const isAnalyst = user?.is_author || false; // TODO: check analyst assignment

  useEffect(() => {
    async function fetchModel() {
      try {
        const [modelRes, dataRes] = await Promise.all([
          fetch(`${API_BASE}/api/models/registry/${slug}/`),
          fetch(`${API_BASE}/api/models/registry/${slug}/data/?limit=500`),
        ]);
        if (!modelRes.ok) throw new Error('Model not found');
        const modelData = await modelRes.json();
        setModel(modelData);
        if (dataRes.ok) {
          const dp = await dataRes.json();
          setDataPoints(Array.isArray(dp) ? dp : []);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchModel();
  }, [slug]);

  const handleSaveEdit = async (field: string) => {
    const token = localStorage.getItem('access_token');
    if (!token || !model) return;
    try {
      const res = await fetch(`${API_BASE}/api/models/registry/${slug}/update/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: editText }),
      });
      if (res.ok) {
        const updated = await res.json();
        setModel(updated);
        setEditing(null);
      }
    } catch {}
  };

  if (loading) return <div className="text-center py-20">Loading model...</div>;
  if (error || !model) return <div className="text-center py-20 text-destructive">Error: {error || 'Not found'}</div>;

  const dates = dataPoints.map(d => d.timestamp);
  const values = dataPoints.map(d => d.value);

  const renderEditableSection = (title: string, field: 'description' | 'methodology' | 'how_to_trade', content: string) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{title}</h3>
        {isAnalyst && editing !== field && (
          <button
            onClick={() => { setEditing(field); setEditText(content); }}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        )}
      </div>
      {editing === field ? (
        <div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="input w-full min-h-[150px] text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => handleSaveEdit(field)} className="btn-primary text-sm px-4 py-1.5">Save</button>
            <button onClick={() => setEditing(null)} className="text-sm text-muted-foreground hover:text-foreground px-4 py-1.5">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {content || <span className="italic text-muted-foreground/50">No content yet.</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{model.name}</h1>
          {signalBadge(model.current_signal)}
        </div>
        <p className="text-lg text-muted-foreground mb-4">{model.short_description}</p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <span>Asset: <strong className="text-foreground">{model.asset_class}</strong></span>
          <span>·</span>
          <span>Frequency: <strong className="text-foreground">{model.frequency}</strong></span>
          <span>·</span>
          <span>Source: <strong className="text-foreground">{model.data_source}</strong></span>
          {model.current_value != null && (
            <>
              <span>·</span>
              <span>Current: <strong className="text-primary">{model.current_value.toFixed(2)}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      {dataPoints.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-10" style={{ background: 'var(--chart-bg, #061829)' }}>
          <Plot
            data={[{
              x: dates,
              y: values,
              mode: 'lines',
              name: model.name,
              line: { width: 2, color: '#00ced1' },
              fill: 'tonexty',
              fillcolor: 'rgba(0, 206, 209, 0.08)',
            }]}
            layout={{
              autosize: true,
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { family: 'Segoe UI, sans-serif', size: 12, color: 'var(--chart-text, #ffffff)' },
              xaxis: {
                showgrid: true, gridcolor: 'var(--chart-grid, #413510)',
                rangeslider: { visible: true },
                rangeselector: {
                  buttons: [
                    { count: 1, label: '1M', step: 'month', stepmode: 'backward' },
                    { count: 3, label: '3M', step: 'month', stepmode: 'backward' },
                    { count: 6, label: '6M', step: 'month', stepmode: 'backward' },
                    { count: 1, label: '1Y', step: 'year', stepmode: 'backward' },
                    { step: 'all', label: 'All' },
                  ],
                  bgcolor: 'var(--card, #0a2438)',
                  activecolor: '#00ced1',
                  font: { color: 'var(--chart-text, #ffffff)' },
                },
              },
              yaxis: { showgrid: true, gridcolor: 'var(--chart-grid, #413510)' },
              margin: { l: 50, r: 20, t: 20, b: 40 },
              hovermode: 'x unified',
            }}
            config={{ displayModeBar: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] as any[] }}
            useResizeHandler
            style={{ width: '100%', height: 'min(600px, 70vh)' }}
          />
        </div>
      )}

      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-2">
          {renderEditableSection('What is this model?', 'description', model.description)}
          {renderEditableSection('Methodology', 'methodology', model.methodology)}
          {renderEditableSection('How to trade it', 'how_to_trade', model.how_to_trade)}
        </div>

        {/* Signal Results Table */}
        <div>
          {model.signal_results && model.signal_results.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Signal Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2">Signal</th>
                      <th className="text-left py-2">Period</th>
                      <th className="text-right py-2">Avg Return</th>
                      <th className="text-right py-2">Hit Rate</th>
                      <th className="text-right py-2">n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.signal_results.map((sr, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2">
                          <span className={sr.signal_type === 'bullish' ? 'text-green-400' : 'text-red-400'}>
                            {sr.signal_type === 'bullish' ? '🟢' : '🔴'} {sr.signal_type}
                          </span>
                        </td>
                        <td className="py-2">{sr.interval_label}</td>
                        <td className={`py-2 text-right font-medium ${sr.avg_return_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {sr.avg_return_pct >= 0 ? '+' : ''}{sr.avg_return_pct.toFixed(1)}%
                        </td>
                        <td className="py-2 text-right">{sr.hit_rate_pct.toFixed(0)}%</td>
                        <td className="py-2 text-right text-muted-foreground">{sr.sample_size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Model metadata */}
          <div className="card mt-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Last Updated</h3>
            <p className="text-sm">{new Date(model.last_updated).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
