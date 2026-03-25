'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { colors2 } from '@/lib/chartTheme';

const OHLCChart = dynamic(() => import('@/components/OHLCChart'), { ssr: false });

interface OHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Constituent {
  symbol: string;
  binance_symbol: string;
  weight: number;
  market_cap: number;
}

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

export default function AltcoinIndexLivePage() {
  const [interval, setInterval] = useState('1d');
  const [btcOHLC, setBtcOHLC] = useState<OHLC[]>([]);
  const [indexOHLC, setIndexOHLC] = useState<OHLC[]>([]);
  const [constituents, setConstituents] = useState<Constituent[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveBtcPrice, setLiveBtcPrice] = useState<number | null>(null);
  const [liveIndexPrice, setLiveIndexPrice] = useState<number | null>(null);
  const livePricesRef = useRef<Map<string, number>>(new Map());
  const basePricesRef = useRef<Map<string, number>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const lastIndexCloseRef = useRef<number>(0);

  // Fetch constituents from DB (only thing that needs DB - 100 rows)
  useEffect(() => {
    fetch('/api/models/index-constituents')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setConstituents(data); })
      .catch(() => {});
  }, []);

  // Fetch BTC OHLC from Binance when interval changes
  useEffect(() => {
    setLoading(true);
    fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=500`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBtcOHLC(data.map((k: any) => ({
            date: new Date(k[0]).toISOString(),
            open: parseFloat(k[1]), high: parseFloat(k[2]),
            low: parseFloat(k[3]), close: parseFloat(k[4]),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [interval]);

  // Compute synthetic index OHLC from constituent Binance klines
  useEffect(() => {
    if (constituents.length === 0) return;

    const fetchIndexOHLC = async () => {
      // Fetch klines for top 20 constituents by weight (covers ~80%+ of index)
      // Fetching all 100 would be too many requests
      const topN = constituents.slice(0, 20);
      const totalWeight = topN.reduce((s, c) => s + c.weight, 0);

      const klinePromises = topN.map((c) =>
        fetch(`https://api.binance.com/api/v3/klines?symbol=${c.binance_symbol}&interval=${interval}&limit=500`)
          .then((r) => r.json())
          .then((raw: any) => Array.isArray(raw) ? raw.map((k: any) => ({
            time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]),
            low: parseFloat(k[3]), close: parseFloat(k[4]),
          })) : [])
          .catch(() => [])
      );

      const allKlines = await Promise.all(klinePromises);

      // Build index candles: for each timestamp, weighted OHLC
      // Use the first constituent's timestamps as reference
      const ref = allKlines.find((k) => Array.isArray(k) && k.length > 0);
      if (!ref) return;

      const indexCandles: OHLC[] = [];
      let prevClose = 100; // start at 100

      for (let i = 0; i < ref.length; i++) {
        let wOpen = 0, wHigh = 0, wLow = 0, wClose = 0;
        let wTotal = 0;

        for (let j = 0; j < topN.length; j++) {
          const klines = allKlines[j];
          if (!Array.isArray(klines) || i >= klines.length || i === 0) continue;

          const prev = klines[i - 1];
          const curr = klines[i];
          if (!prev || !curr || prev.close <= 0) continue;

          const w = topN[j].weight / totalWeight; // normalize to top-N
          wOpen  += (curr.open / prev.close - 1) * w;
          wHigh  += (curr.high / prev.close - 1) * w;
          wLow   += (curr.low / prev.close - 1) * w;
          wClose += (curr.close / prev.close - 1) * w;
          wTotal += w;
        }

        if (i === 0) {
          indexCandles.push({
            date: new Date(ref[i].time).toISOString(),
            open: 100, high: 100, low: 100, close: 100,
          });
          prevClose = 100;
        } else {
          const o = prevClose * (1 + wOpen);
          const h = prevClose * (1 + wHigh);
          const l = prevClose * (1 + wLow);
          const c = prevClose * (1 + wClose);
          indexCandles.push({
            date: new Date(ref[i].time).toISOString(),
            open: o, high: h, low: l, close: c,
          });
          prevClose = c;
        }
      }

      setIndexOHLC(indexCandles);
      if (indexCandles.length > 0) {
        lastIndexCloseRef.current = indexCandles[indexCandles.length - 1].close;
      }

      // Store base prices for live return computation
      for (const c of topN) {
        const kl = allKlines[topN.indexOf(c)];
        if (Array.isArray(kl) && kl.length > 0) {
          basePricesRef.current.set(c.binance_symbol, kl[kl.length - 1].close);
        }
      }
    };

    fetchIndexOHLC();
  }, [constituents, interval]);

  // Binance WebSocket for live ticks
  useEffect(() => {
    if (constituents.length === 0) return;
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    const streams = ['btcusdt@miniTicker'];
    const topN = constituents.slice(0, 20);
    const totalWeight = topN.reduce((s, c) => s + c.weight, 0);

    for (const c of topN) {
      if (c.binance_symbol) {
        streams.push(`${c.binance_symbol.toLowerCase()}@miniTicker`);
      }
    }

    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.data || !msg.data.s || !msg.data.c) return;

        const symbol = msg.data.s;
        const price = parseFloat(msg.data.c);
        livePricesRef.current.set(symbol, price);

        if (symbol === 'BTCUSDT') setLiveBtcPrice(price);

        // Recompute live index from weighted returns vs base prices
        let weightedReturn = 0;
        for (const c of topN) {
          const lp = livePricesRef.current.get(c.binance_symbol);
          const bp = basePricesRef.current.get(c.binance_symbol);
          if (lp && bp && bp > 0) {
            const w = c.weight / totalWeight;
            weightedReturn += ((lp / bp) - 1) * w;
          }
        }

        if (lastIndexCloseRef.current > 0) {
          setLiveIndexPrice(lastIndexCloseRef.current * (1 + weightedReturn));
        }
      } catch {}
    };

    return () => { ws.close(); wsRef.current = null; };
  }, [constituents]);

  const latestBtc = btcOHLC.length > 0 ? btcOHLC[btcOHLC.length - 1] : null;
  const latestIdx = indexOHLC.length > 0 ? indexOHLC[indexOHLC.length - 1] : null;

  return (
    <div className="max-w-[1800px] mx-auto py-6 px-4">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold mb-2">Altcoin 100 Index — Live</h1>
        <p className="text-muted-foreground text-sm">
          Market-cap weighted index of top 100 altcoins vs Bitcoin. Real-time via Binance.
        </p>
      </div>

      {/* Interval selector + stats */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1 rounded-lg p-1 bg-muted/50">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setInterval(iv.value)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                interval === iv.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4 text-sm">
          {latestIdx && (
            <span>
              <span className="text-muted-foreground">Alt100: </span>
              <span className="font-bold" style={{ color: colors2.bright_green }}>
                {(liveIndexPrice ?? latestIdx.close).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </span>
          )}
          {latestBtc && (
            <span>
              <span className="text-muted-foreground">BTC: </span>
              <span className="font-bold text-white">
                ${(liveBtcPrice ?? latestBtc.close).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </span>
          )}
          <span className="flex items-center gap-1 text-xs" style={{ color: colors2.bright_green }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Side-by-side OHLC charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OHLCChart
          data={indexOHLC}
          title="Altcoin 100 Index"
          livePrice={liveIndexPrice}
          height={550}
          tickprefix=""
        />
        <OHLCChart
          data={btcOHLC}
          title="BTC/USD"
          livePrice={liveBtcPrice}
          height={550}
        />
      </div>

      {/* Constituents */}
      {constituents.length > 0 && (
        <div className="mt-6 card">
          <h2 className="text-lg font-bold mb-4">Index Constituents (Top 20 by Weight)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-right py-2">Weight</th>
                  <th className="text-right py-2">Market Cap</th>
                  <th className="text-right py-2">Change</th>
                  <th className="text-right py-2">Live Price</th>
                </tr>
              </thead>
              <tbody>
                {constituents.slice(0, 20).map((c, i) => {
                  const lp = livePricesRef.current.get(c.binance_symbol);
                  const bp = basePricesRef.current.get(c.binance_symbol);
                  const change = lp && bp && bp > 0 ? ((lp / bp) - 1) * 100 : null;
                  return (
                    <tr key={c.symbol} className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-medium">{c.symbol}</td>
                      <td className="py-2 text-right">{(c.weight * 100).toFixed(2)}%</td>
                      <td className="py-2 text-right text-muted-foreground">
                        {c.market_cap > 1e9 ? `$${(c.market_cap / 1e9).toFixed(1)}B` : `$${(c.market_cap / 1e6).toFixed(0)}M`}
                      </td>
                      <td className="py-2 text-right font-mono" style={{ color: change != null ? (change >= 0 ? colors2.bright_green : colors2.red) : colors2.grey }}>
                        {change != null ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
                      </td>
                      <td className="py-2 text-right font-mono" style={{ color: lp ? colors2.bright_green : colors2.grey }}>
                        {lp ? `$${lp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
