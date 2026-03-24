'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';
import { toast } from 'sonner';

interface QuantModel {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  asset_class: string;
  frequency: string;
  data_source: string;
  is_premium: boolean;
  is_published: boolean;
  current_signal: string | null;
  current_value: number | null;
  last_updated: string;
  page_url: string;
}

const signalEmoji: Record<string, string> = { bullish: '🟢', bearish: '🔴', neutral: '⚪' };

export default function ModelsDashboard() {
  const [models, setModels] = useState<QuantModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/api/models/registry/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => setModels(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load models'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Models Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage quantitative models, signals, and data</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary">{models.length}</div>
          <div className="text-xs text-muted-foreground">Total Models</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">
            {models.filter(m => m.current_signal === 'bullish').length}
          </div>
          <div className="text-xs text-muted-foreground">Bullish</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-400">
            {models.filter(m => m.current_signal === 'bearish').length}
          </div>
          <div className="text-xs text-muted-foreground">Bearish</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-muted-foreground">
            {models.filter(m => m.is_premium).length}
          </div>
          <div className="text-xs text-muted-foreground">Premium</div>
        </div>
      </div>

      {/* Models table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-3 px-4">Model</th>
              <th className="text-left py-3 px-4">Asset Class</th>
              <th className="text-left py-3 px-4">Frequency</th>
              <th className="text-left py-3 px-4">Signal</th>
              <th className="text-right py-3 px-4">Value</th>
              <th className="text-left py-3 px-4">Updated</th>
              <th className="text-center py-3 px-4">Premium</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-muted-foreground">{model.short_description}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary capitalize">
                    {model.asset_class}
                  </span>
                </td>
                <td className="py-3 px-4 capitalize">{model.frequency}</td>
                <td className="py-3 px-4">
                  {model.current_signal ? (
                    <span className="text-sm">
                      {signalEmoji[model.current_signal] || '⚪'} {model.current_signal}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {model.current_value != null ? model.current_value.toFixed(2) : '—'}
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground">
                  {new Date(model.last_updated).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-center">
                  {model.is_premium ? (
                    <span className="text-primary text-xs">🔒 Yes</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Free</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={model.page_url || `/models/${model.slug}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </Link>
                    <Link
                      href={`/models/${model.slug}`}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {models.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No models registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
