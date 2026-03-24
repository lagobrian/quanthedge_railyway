'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { computeRSI, computeStochRSI, computeMomentum } from '@/lib/indicators';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CryptoChartProps {
  symbol?: string;
  interval?: string;
  onClose?: () => void;
  height?: number;
  className?: string;
}

const INTERVALS = [
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1M' },
];

export default function CryptoChart({
  symbol: initialSymbol = 'BTCUSDT',
  interval: initialInterval = '1d',
  onClose,
  height = 600,
  className = '',
}: CryptoChartProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [interval, setInterval] = useState(initialInterval);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCandle, setLiveCandle] = useState<Candle | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const wsRef = useRef<WebSocket | null>(null);

  // Detect theme
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Sync external symbol prop
  useEffect(() => { setSymbol(initialSymbol); }, [initialSymbol]);

  // Fetch historical klines
  useEffect(() => {
    setLoading(true);
    fetch(`/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=500`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCandles(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol, interval]);

  // WebSocket for live candle updates
  useEffect(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    const pair = symbol.toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@kline_${interval}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.e === 'kline') {
          const k = msg.k;
          setLiveCandle({
            time: k.t,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          });
        }
      } catch {}
    };

    return () => { ws.close(); wsRef.current = null; };
  }, [symbol, interval]);

  // Merge live candle
  const allCandles = useMemo(() => {
    if (!candles.length) return [];
    const merged = [...candles];
    if (liveCandle) {
      const idx = merged.findIndex((c) => c.time === liveCandle.time);
      if (idx >= 0) merged[idx] = liveCandle;
      else merged.push(liveCandle);
    }
    return merged;
  }, [candles, liveCandle]);

  // Compute chart data + indicators
  const chartData = useMemo(() => {
    if (!allCandles.length) return null;

    const dates = allCandles.map((c) => {
      const d = new Date(c.time);
      return d.toISOString().split('T')[0];
    });
    const closes = allCandles.map((c) => c.close);
    const stoch = computeStochRSI(closes, 14, 14, 3, 3);
    const momentum = computeMomentum(closes, 10);

    return { dates, closes, stochK: stoch.k, stochD: stoch.d, momentum };
  }, [allCandles]);

  // Export chart as PNG
  const handleScreenshot = useCallback(() => {
    const plotEl = document.querySelector('.crypto-chart-plotly .js-plotly-plot') as any;
    if (plotEl && (window as any).Plotly) {
      (window as any).Plotly.downloadImage(plotEl, {
        format: 'png',
        filename: `${symbol}-chart`,
        height: 800,
        width: 1400,
        scale: 3,
      });
    }
  }, [symbol]);

  const isDark = theme === 'dark';

  // Signature theme colors (matching notebook: #061829 bg, #413510 grid, Segoe Script)
  const colors = isDark
    ? {
        bg: '#061829',
        paper: '#061829',
        gridColor: '#413510',
        lineColor: '#413510',
        textColor: '#ffffff',
        priceLineColor: '#ffffff',
        stochK: '#00ced1',
        stochD: '#ababab',
        momentum: '#ba5533',
        refLine: '#413510',
        zeroLine: '#413510',
        sliderBg: '#0a2438',
        borderColor: '#413510',
        hoverBg: '#0a2438',
      }
    : {
        bg: '#ffffff',
        paper: '#ffffff',
        gridColor: '#e0e4ea',
        lineColor: '#dce1e8',
        textColor: '#1a2332',
        priceLineColor: '#1a2332',
        stochK: '#0097a7',
        stochD: '#5a6577',
        momentum: '#d14422',
        refLine: '#e0e4ea',
        zeroLine: '#dce1e8',
        sliderBg: '#f0f2f5',
        borderColor: '#dce1e8',
        hoverBg: '#eef1f6',
      };

  const latestPrice = allCandles.length ? allCandles[allCandles.length - 1].close : null;
  const prevPrice = allCandles.length > 1 ? allCandles[allCandles.length - 2].close : null;
  const priceChange = latestPrice && prevPrice ? latestPrice - prevPrice : null;
  const pctChange = priceChange && prevPrice ? (priceChange / prevPrice) * 100 : null;

  if (loading && !candles.length) {
    return (
      <div className={`rounded-xl border flex items-center justify-center ${className}`} style={{ height, borderColor: colors.borderColor, background: colors.bg }}>
        <span className="text-muted-foreground text-sm">Loading {symbol}...</span>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className={`rounded-xl border flex items-center justify-center ${className}`} style={{ height, borderColor: colors.borderColor, background: colors.bg }}>
        <span className="text-muted-foreground text-sm">No data for {symbol}</span>
      </div>
    );
  }

  const { dates, closes, stochK, stochD, momentum } = chartData;

  // Price trace
  const traces: any[] = [
    {
      x: dates,
      y: closes,
      type: 'scatter',
      mode: 'lines',
      name: 'Price',
      line: { width: 1.8, color: colors.priceLineColor },
      yaxis: 'y',
      hovertemplate: '$%{y:,.2f}<extra></extra>',
    },
    // Stoch RSI %K
    {
      x: dates,
      y: stochK,
      type: 'scatter',
      mode: 'lines',
      name: 'Stoch RSI %K',
      line: { width: 1.5, color: colors.stochK },
      yaxis: 'y2',
      hovertemplate: '%{y:.1f}<extra></extra>',
    },
    // Stoch RSI %D (signal)
    {
      x: dates,
      y: stochD,
      type: 'scatter',
      mode: 'lines',
      name: 'Stoch RSI %D',
      line: { width: 1, color: colors.stochD, dash: 'dot' },
      yaxis: 'y2',
      hovertemplate: '%{y:.1f}<extra></extra>',
    },
    // Momentum
    {
      x: dates,
      y: momentum,
      type: 'scatter',
      mode: 'lines',
      name: 'Momentum',
      line: { width: 1.2, color: colors.momentum },
      yaxis: 'y3',
      hovertemplate: '%{y:.2f}%<extra></extra>',
    },
  ];

  const layout: any = {
    autosize: true,
    paper_bgcolor: colors.paper,
    plot_bgcolor: colors.bg,
    font: { family: 'Segoe Script, cursive', size: 12, color: colors.textColor },
    margin: { l: 55, r: 15, t: 10, b: 5 },
    showlegend: false,
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: isDark ? '#1e293b' : '#ffffff',
      bordercolor: isDark ? '#334155' : '#e2e8f0',
      font: { size: 11, color: isDark ? '#e2e8f0' : '#1e293b' },
    },

    // Price y-axis (top ~55%)
    yaxis: {
      domain: [0.38, 1.0],
      showgrid: true,
      gridcolor: colors.gridColor,
      showline: false,
      zeroline: false,
      tickformat: '$,.0f',
      tickfont: { size: 10 },
      side: 'left',
    },

    // Stoch RSI y-axis (middle ~18%)
    yaxis2: {
      domain: [0.18, 0.35],
      showgrid: true,
      gridcolor: colors.gridColor,
      showline: false,
      zeroline: false,
      range: [-5, 105],
      tickvals: [0, 20, 50, 80, 100],
      tickfont: { size: 9 },
      side: 'left',
    },

    // Momentum y-axis (lower ~13%)
    yaxis3: {
      domain: [0.0, 0.15],
      showgrid: true,
      gridcolor: colors.gridColor,
      showline: false,
      zeroline: true,
      zerolinecolor: colors.zeroLine,
      tickfont: { size: 9 },
      ticksuffix: '%',
      side: 'left',
    },

    xaxis: {
      showgrid: false,
      showline: false,
      showticklabels: true,
      tickfont: { size: 9, color: colors.textColor },
      rangeslider: {
        visible: true,
        thickness: 0.06,
        bgcolor: colors.sliderBg,
        bordercolor: colors.borderColor,
        borderwidth: 1,
      },
      rangeselector: { visible: false },
    },

    // Horizontal reference lines
    shapes: [
      // Stoch RSI overbought (80)
      {
        type: 'line', xref: 'paper', yref: 'y2',
        x0: 0, x1: 1, y0: 80, y1: 80,
        line: { color: colors.refLine, width: 1, dash: 'dash' },
      },
      // Stoch RSI oversold (20)
      {
        type: 'line', xref: 'paper', yref: 'y2',
        x0: 0, x1: 1, y0: 20, y1: 20,
        line: { color: colors.refLine, width: 1, dash: 'dash' },
      },
      // Stoch RSI midline (50)
      {
        type: 'line', xref: 'paper', yref: 'y2',
        x0: 0, x1: 1, y0: 50, y1: 50,
        line: { color: colors.zeroLine, width: 0.5, dash: 'dot' },
      },
      // Separator between price and oscillator
      {
        type: 'line', xref: 'paper', yref: 'paper',
        x0: 0, x1: 1, y0: 0.36, y1: 0.36,
        line: { color: colors.lineColor, width: 1 },
      },
      // Separator between stoch and momentum
      {
        type: 'line', xref: 'paper', yref: 'paper',
        x0: 0, x1: 1, y0: 0.16, y1: 0.16,
        line: { color: colors.lineColor, width: 1 },
      },
    ],
  };

  const config = {
    displayModeBar: false,
    displaylogo: false,
    responsive: true,
    scrollZoom: true,
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden ${className}`}
      style={{ borderColor: colors.borderColor, background: colors.bg }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {symbol.replace('USDT', '/USDT')}
          </span>
          {latestPrice != null && (
            <span className="text-base font-semibold" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
              ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          {pctChange != null && (
            <span
              className="text-sm font-medium"
              style={{ color: pctChange >= 0 ? '#10b981' : '#ef4444' }}
            >
              {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Interval selector */}
          <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
            {INTERVALS.map((iv) => (
              <button
                key={iv.value}
                onClick={() => setInterval(iv.value)}
                className="px-2.5 py-1 text-xs rounded-md transition-all"
                style={{
                  background: interval === iv.value ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent',
                  color: interval === iv.value ? (isDark ? '#f1f5f9' : '#0f172a') : colors.textColor,
                  fontWeight: interval === iv.value ? 600 : 400,
                }}
              >
                {iv.label}
              </button>
            ))}
          </div>

          {/* Screenshot */}
          <button
            onClick={handleScreenshot}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: colors.textColor }}
            title="Save as PNG"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: colors.textColor }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Indicator legend */}
      <div className="flex items-center gap-4 px-4 py-1.5 text-xs" style={{ borderBottom: `1px solid ${colors.borderColor}`, color: colors.textColor }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ background: colors.stochK, display: 'inline-block' }} />
          Stoch RSI
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ background: colors.momentum, display: 'inline-block' }} />
          Momentum
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>LIVE</span>
        </span>
      </div>

      {/* Chart */}
      <div className="crypto-chart-plotly">
        <Plot
          data={traces}
          layout={layout}
          config={config}
          useResizeHandler
          style={{ width: '100%', height: height - 85 }}
        />
      </div>
    </div>
  );
}
