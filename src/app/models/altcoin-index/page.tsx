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

function parseBinanceKlines(raw: any): { time: number; open: number; high: number; low: number; close: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((k: any) => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
  }));
}

export default function AltcoinIndexPage() {
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

  // Fetch BTC + constituent klines together and sync date ranges
  useEffect(() => {
    if (constituents.length === 0) return;
    setLoading(true);

    const topN = constituents.filter((c) => c.weight > 0).slice(0, 20);
    const totalWeight = topN.reduce((s, c) => s + c.weight, 0);

    const fetchAll = async () => {
      // Fetch BTC + all constituent klines in parallel
      const [btcRaw, ...constituentRaws] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=500`)
          .then((r) => r.json()).catch(() => []),
        ...topN.map((c) =>
          fetch(`https://api.binance.com/api/v3/klines?symbol=${c.binance_symbol}&interval=${interval}&limit=500`)
            .then((r) => r.json()).catch(() => [])
        ),
      ]);

      const btcKlines = parseBinanceKlines(btcRaw);
      const allKlines = constituentRaws.map(parseBinanceKlines);

      if (btcKlines.length === 0) { setLoading(false); return; }

      // Build a set of timestamps that BTC has
      const btcTimeSet = new Set(btcKlines.map((k) => k.time));

      // Find common timestamps across BTC and at least 5 constituents
      const timeCounts = new Map<number, number>();
      for (const klines of allKlines) {
        for (const k of klines) {
          if (btcTimeSet.has(k.time)) {
            timeCounts.set(k.time, (timeCounts.get(k.time) || 0) + 1);
          }
        }
      }
      // Keep timestamps where at least 5 constituents have data
      const commonTimes = Array.from(timeCounts.entries())
        .filter(([, count]) => count >= 5)
        .map(([time]) => time)
        .sort((a, b) => a - b);

      if (commonTimes.length < 2) { setLoading(false); return; }

      // Build BTC OHLC for common timestamps only
      const btcMap = new Map(btcKlines.map((k) => [k.time, k]));
      const syncedBtc: OHLC[] = commonTimes
        .filter((t) => btcMap.has(t))
        .map((t) => {
          const k = btcMap.get(t)!;
          return { date: new Date(t).toISOString(), open: k.open, high: k.high, low: k.low, close: k.close };
        });
      setBtcOHLC(syncedBtc);

      // Build constituent maps for quick lookup
      const constituentMaps = allKlines.map((klines) =>
        new Map(klines.map((k) => [k.time, k]))
      );

      // Build index candles for common timestamps
      const indexCandles: OHLC[] = [];
      let prevClose = 100;

      for (let i = 0; i < commonTimes.length; i++) {
        const t = commonTimes[i];

        if (i === 0) {
          indexCandles.push({ date: new Date(t).toISOString(), open: 100, high: 100, low: 100, close: 100 });
          prevClose = 100;
          continue;
        }

        const prevT = commonTimes[i - 1];
        let wOpen = 0, wHigh = 0, wLow = 0, wClose = 0;

        for (let j = 0; j < topN.length; j++) {
          const curr = constituentMaps[j].get(t);
          const prev = constituentMaps[j].get(prevT);
          if (!curr || !prev || prev.close <= 0) continue;

          const w = topN[j].weight / totalWeight;
          wOpen += (curr.open / prev.close - 1) * w;
          wHigh += (curr.high / prev.close - 1) * w;
          wLow += (curr.low / prev.close - 1) * w;
          wClose += (curr.close / prev.close - 1) * w;
        }

        const o = prevClose * (1 + wOpen);
        const h = prevClose * (1 + wHigh);
        const l = prevClose * (1 + wLow);
        const c = prevClose * (1 + wClose);
        indexCandles.push({ date: new Date(t).toISOString(), open: o, high: h, low: l, close: c });
        prevClose = c;
      }

      setIndexOHLC(indexCandles);
      if (indexCandles.length > 0) {
        lastIndexCloseRef.current = indexCandles[indexCandles.length - 1].close;
      }

      // Store base prices for live return computation
      for (let j = 0; j < topN.length; j++) {
        const lastTime = commonTimes[commonTimes.length - 1];
        const k = constituentMaps[j].get(lastTime);
        if (k) basePricesRef.current.set(topN[j].binance_symbol, k.close);
      }

      setLoading(false);
    };

    fetchAll();
  }, [constituents, interval]);

  // Binance WebSocket for live ticks
  useEffect(() => {
    if (constituents.length === 0) return;
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    const topN = constituents.filter((c) => c.weight > 0).slice(0, 20);
    const totalWeight = topN.reduce((s, c) => s + c.weight, 0);
    const streams = ['btcusdt@miniTicker', ...topN.map((c) => `${c.binance_symbol.toLowerCase()}@miniTicker`)];

    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.data?.s || !msg.data?.c) return;

        const symbol = msg.data.s;
        const price = parseFloat(msg.data.c);
        livePricesRef.current.set(symbol, price);

        if (symbol === 'BTCUSDT') setLiveBtcPrice(price);

        // Recompute live index
        let weightedReturn = 0;
        for (const c of topN) {
          const lp = livePricesRef.current.get(c.binance_symbol);
          const bp = basePricesRef.current.get(c.binance_symbol);
          if (lp && bp && bp > 0) {
            weightedReturn += ((lp / bp) - 1) * (c.weight / totalWeight);
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

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading charts...</div>
      ) : (
        <>
          {/* Side-by-side OHLC charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OHLCChart data={indexOHLC} title="Altcoin 100 Index" livePrice={liveIndexPrice} height={550} tickprefix="" />
            <OHLCChart data={btcOHLC} title="BTC/USD" livePrice={liveBtcPrice} height={550} />
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
                    {constituents.filter((c) => c.weight > 0).slice(0, 20).map((c, i) => {
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
        </>
      )}
    </div>
  );
}
