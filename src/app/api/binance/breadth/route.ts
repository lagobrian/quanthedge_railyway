import { NextRequest, NextResponse } from 'next/server';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

// Top crypto symbols to track breadth (by market cap, all USDT pairs)
const BREADTH_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'TRXUSDT',
  'LINKUSDT', 'MATICUSDT', 'SHIBUSDT', 'LTCUSDT', 'BCHUSDT',
  'ATOMUSDT', 'UNIUSDT', 'XLMUSDT', 'ETCUSDT', 'NEARUSDT',
  'APTUSDT', 'FILUSDT', 'ARBUSDT', 'OPUSDT', 'MKRUSDT',
  'AAVEUSDT', 'GRTUSDT', 'INJUSDT', 'FTMUSDT', 'THETAUSDT',
  'ALGOUSDT', 'XTZUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT',
  'EGLDUSDT', 'FLOWUSDT', 'CHZUSDT', 'APEUSDT', 'GALAUSDT',
  'RUNEUSDT', 'ENJUSDT', 'COMPUSDT', 'SNXUSDT', 'YFIUSDT',
  'SUSHIUSDT', 'CRVUSDT', 'DYDXUSDT', '1INCHUSDT', 'BATUSDT',
];

function computeSMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    result[i] = sum / period;
  }
  return result;
}

async function fetchKlines(symbol: string, limit: number): Promise<number[][] | null> {
  try {
    const res = await fetch(
      `${BINANCE_BASE}/klines?symbol=${symbol}&interval=1d&limit=${limit}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const limit = 300; // enough for 200 DMA + some history

  // Fetch all symbols in parallel (batched to avoid rate limits)
  const batchSize = 10;
  const allKlines: Map<string, number[][]> = new Map();

  for (let i = 0; i < BREADTH_SYMBOLS.length; i += batchSize) {
    const batch = BREADTH_SYMBOLS.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((s) => fetchKlines(s, limit)));
    batch.forEach((s, idx) => {
      if (results[idx]) allKlines.set(s, results[idx]!);
    });
  }

  if (allKlines.size === 0) {
    return NextResponse.json({ error: 'No data fetched' }, { status: 500 });
  }

  // Find the common date range from the first symbol that has data
  const refSymbol = Array.from(allKlines.values())[0];
  const dates = refSymbol.map((k: any) => {
    const d = new Date(k[0]);
    return d.toISOString().split('T')[0];
  });

  // For each date, compute % of coins above 50/100/200 DMA
  const breadthData: { date: string; pct_above_50dma: number; pct_above_100dma: number; pct_above_200dma: number }[] = [];

  // Pre-compute SMAs for all symbols
  const symbolSMAs: { sma50: (number | null)[]; sma100: (number | null)[]; sma200: (number | null)[]; closes: number[] }[] = [];

  Array.from(allKlines.entries()).forEach(([, klines]) => {
    const closes = klines.map((k: any) => parseFloat(k[4]));
    symbolSMAs.push({
      closes,
      sma50: computeSMA(closes, 50),
      sma100: computeSMA(closes, 100),
      sma200: computeSMA(closes, 200),
    });
  });

  for (let i = 0; i < dates.length; i++) {
    let above50 = 0, above100 = 0, above200 = 0;
    let count50 = 0, count100 = 0, count200 = 0;

    for (const data of symbolSMAs) {
      if (i >= data.closes.length) continue;
      const close = data.closes[i];
      if (data.sma50[i] != null) { count50++; if (close > data.sma50[i]!) above50++; }
      if (data.sma100[i] != null) { count100++; if (close > data.sma100[i]!) above100++; }
      if (data.sma200[i] != null) { count200++; if (close > data.sma200[i]!) above200++; }
    }

    if (count50 > 0 || count100 > 0 || count200 > 0) {
      breadthData.push({
        date: dates[i],
        pct_above_50dma: count50 > 0 ? (above50 / count50) * 100 : 0,
        pct_above_100dma: count100 > 0 ? (above100 / count100) * 100 : 0,
        pct_above_200dma: count200 > 0 ? (above200 / count200) * 100 : 0,
      });
    }
  }

  return NextResponse.json(breadthData, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  });
}
