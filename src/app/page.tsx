'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { Footer } from '@/components/footer';

interface Model {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  asset_class: string;
  current_signal: string | null;
  current_value: number | null;
  last_updated: string;
  page_url: string;
}

interface RecentPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  reading_time: number;
  category: string;
}

const signalConfig: Record<string, { emoji: string; color: string; bg: string }> = {
  bullish: { emoji: '🟢', color: 'text-green-400', bg: 'bg-green-400/10' },
  bearish: { emoji: '🔴', color: 'text-red-400', bg: 'bg-red-400/10' },
  neutral: { emoji: '⚪', color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

export default function Dashboard() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [symbol, setSymbol] = useState('BINANCE:BTCUSDT');
  const [symbolInput, setSymbolInput] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [posts, setPosts] = useState<RecentPost[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/models/registry/`)
      .then(r => r.json())
      .then(d => setModels(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch(`${API_BASE}/api/posts/?page=1`)
      .then(r => r.json())
      .then(d => setPosts((d.results || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleSymbolChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbolInput.trim()) {
      setSymbol(symbolInput.trim().toUpperCase());
      setSymbolInput('');
    }
  };

  const quickSymbols = ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'NASDAQ:AAPL', 'SP:SPX', 'TVC:DXY', 'TVC:GOLD', 'NYMEX:CL1!'];
  const quickLabels = ['BTC', 'ETH', 'AAPL', 'SPX', 'DXY', 'GOLD', 'OIL'];

  const withSignal = models.filter(m => m.current_signal);
  const bullish = withSignal.filter(m => m.current_signal === 'bullish').length;
  const total = withSignal.length;

  const timeAgo = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.floor(h/24)}d ago`;
  };

  return (
    <div className="min-h-screen">
      {/* Ticker Bar */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <form onSubmit={handleSymbolChange} className="flex items-center gap-2">
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              placeholder="Search symbol..."
              className="input w-48 text-sm py-1.5"
            />
            <button type="submit" className="btn-primary text-xs px-3 py-1.5">Go</button>
          </form>
          <div className="flex gap-1 flex-wrap">
            {quickSymbols.map((s, i) => (
              <button
                key={s}
                onClick={() => setSymbol(s)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  symbol === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {quickLabels[i]}
              </button>
            ))}
          </div>
          {total > 0 && (
            <div className="ml-auto text-sm text-muted-foreground">
              Confluence: <strong className="text-green-400">{bullish}</strong>/{total} Bullish
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-[1800px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* TradingView Chart - 2 cols */}
          <div className="lg:col-span-2 card p-0 overflow-hidden" style={{ minHeight: '500px' }}>
            <div id="tradingview-widget" style={{ height: '100%', minHeight: '500px' }}>
              <iframe
                key={symbol + theme}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${symbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=${theme === 'dark' ? '1d2330' : 'f8f9fc'}&studies=[]&theme=${theme === 'dark' ? 'dark' : 'light'}&style=1&timezone=exchange&withdateranges=1&showpopupbutton=0&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=quanthedge.com`}
                style={{ width: '100%', height: '100%', minHeight: '500px', border: 'none' }}
                allowFullScreen
              />
            </div>
          </div>

          {/* Model Signals Panel - 1 col */}
          <div className="card flex flex-col" style={{ minHeight: '500px' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Model Signals</h2>
              <Link href="/confluence" className="text-xs text-primary hover:underline">View All</Link>
            </div>

            {total > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>🟢 {bullish} Bullish</span>
                  <span>🔴 {withSignal.filter(m => m.current_signal === 'bearish').length} Bearish</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                  <div className="bg-green-400" style={{ width: `${(bullish/total)*100}%` }} />
                  <div className="bg-red-400" style={{ width: `${(withSignal.filter(m => m.current_signal === 'bearish').length/total)*100}%` }} />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2">
              {models.map(m => {
                const sig = signalConfig[m.current_signal || 'neutral'] || signalConfig.neutral;
                return (
                  <Link
                    key={m.id}
                    href={m.page_url || `/models/${m.slug}`}
                    className={`block p-3 rounded-lg border border-border hover:border-primary/30 transition-all ${sig.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{sig.emoji}</span>
                        <span className="text-sm font-medium">{m.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{timeAgo(m.last_updated)}</span>
                    </div>
                    {m.current_value != null && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Value: <span className="font-mono text-foreground">{m.current_value.toFixed(1)}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
              {models.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading models...</div>
              )}
            </div>
          </div>
        </div>

        {/* Second Row: Model Chart Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {models.slice(0, 3).map(m => (
            <Link
              key={m.id}
              href={m.page_url || `/models/${m.slug}`}
              className="card group hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">{m.name}</h3>
                <svg className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"/>
                </svg>
              </div>
              <div className="h-32 bg-muted/30 rounded-lg overflow-hidden mb-3">
                <img
                  src={`${API_BASE}/api/models/chart-thumbnail/${m.slug}/`}
                  alt={m.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{m.asset_class} · {m.short_description?.slice(0, 40)}...</span>
                {m.current_signal && (
                  <span className={signalConfig[m.current_signal]?.color || 'text-gray-400'}>
                    {signalConfig[m.current_signal]?.emoji} {m.current_signal}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Third Row: Recent Newsletters */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Latest Newsletters</h2>
            <Link href="/blog" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {posts.map(p => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card group hover:border-primary/30 transition-all">
                <div className="text-xs text-primary mb-2">{p.category || 'Newsletter'}</div>
                <h3 className="font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.excerpt}</p>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {p.reading_time > 0 && ` · ${p.reading_time} min read`}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA for non-logged-in users */}
        {!isAuthenticated && (
          <div className="mt-8 card bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-center py-10">
            <h2 className="text-2xl font-bold mb-3">Your Quantitative Edge in the Markets</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Access real-time financial models, backtested strategies, and market insights.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register" className="btn-primary px-6 py-3">Get Started Free</Link>
              <Link href="/pricing" className="btn-outline px-6 py-3">View Pricing</Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
