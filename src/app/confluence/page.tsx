'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

interface Model {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  asset_class: string;
  frequency: string;
  current_signal: string | null;
  current_value: number | null;
  last_updated: string;
  page_url: string;
  is_premium: boolean;
}

const signalConfig: Record<string, { emoji: string; color: string; label: string }> = {
  bullish: { emoji: '🟢', color: 'text-green-400', label: 'Bullish' },
  bearish: { emoji: '🔴', color: 'text-red-400', label: 'Bearish' },
  neutral: { emoji: '⚪', color: 'text-muted-foreground', label: 'Neutral' },
};

const assetClasses = ['all', 'crypto', 'equity', 'macro', 'fx', 'commodity'];

export default function ConfluencePage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch(`${API_BASE}/api/models/registry/`)
      .then(r => r.json())
      .then(data => setModels(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? models : models.filter(m => m.asset_class === filter);
  const withSignal = filtered.filter(m => m.current_signal);
  const bullish = withSignal.filter(m => m.current_signal === 'bullish').length;
  const bearish = withSignal.filter(m => m.current_signal === 'bearish').length;
  const neutral = withSignal.filter(m => m.current_signal === 'neutral').length;
  const total = withSignal.length;
  const bullishPct = total > 0 ? (bullish / total) * 100 : 0;

  // Group by asset class
  const grouped = filtered.reduce((acc, m) => {
    const key = m.asset_class || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<string, Model[]>);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) return <div className="text-center py-20">Loading confluence...</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">Model Confluence</h1>
        <p className="text-muted-foreground text-lg">All Q(h)Edge model signals at a glance</p>
      </div>

      {/* Confluence Score */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Overall Confluence</div>
            <div className="text-3xl font-bold">
              <span className="text-green-400">{bullish}</span>
              {' of '}
              <span>{total}</span>
              {' models Bullish'}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>🟢 {bullish}</span>
              <span>⚪ {neutral}</span>
              <span>🔴 {bearish}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              <div className="bg-green-400 transition-all" style={{ width: `${bullishPct}%` }} />
              <div className="bg-gray-400 transition-all" style={{ width: `${total > 0 ? (neutral / total) * 100 : 0}%` }} />
              <div className="bg-red-400 transition-all" style={{ width: `${total > 0 ? (bearish / total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Asset class filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {assetClasses.map(ac => (
          <button
            key={ac}
            onClick={() => setFilter(ac)}
            className={`px-4 py-2 text-sm rounded-full transition-all capitalize ${
              filter === ac
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {ac === 'all' ? 'All Models' : ac}
          </button>
        ))}
      </div>

      {/* Models by group */}
      {Object.entries(grouped).map(([assetClass, groupModels]) => (
        <div key={assetClass} className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">
            {assetClass}
          </h2>
          <div className="space-y-2">
            {groupModels.map(m => {
              const sig = signalConfig[m.current_signal || 'neutral'] || signalConfig.neutral;
              return (
                <Link
                  key={m.id}
                  href={m.page_url || `/models/${m.slug}`}
                  className="card flex items-center justify-between py-4 px-5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl">{sig.emoji}</span>
                    <div>
                      <div className="font-medium group-hover:text-primary transition-colors">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.short_description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className={`font-semibold ${sig.color}`}>{sig.label}</span>
                    {m.current_value != null && (
                      <span className="font-mono text-muted-foreground">{m.current_value.toFixed(1)}</span>
                    )}
                    <span className="text-xs text-muted-foreground hidden md:block">{timeAgo(m.last_updated)}</span>
                    <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {models.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No models registered yet.
        </div>
      )}
    </div>
  );
}
