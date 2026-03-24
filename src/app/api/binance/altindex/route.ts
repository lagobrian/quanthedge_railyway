import { NextResponse } from 'next/server';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

// Top altcoins by market cap (excluding BTC and stablecoins)
const ALTCOINS = [
  'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT',
  'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'TRXUSDT', 'LINKUSDT',
  'MATICUSDT', 'SHIBUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
  'UNIUSDT', 'XLMUSDT', 'ETCUSDT', 'NEARUSDT', 'APTUSDT',
  'FILUSDT', 'ARBUSDT', 'OPUSDT', 'MKRUSDT', 'AAVEUSDT',
  'GRTUSDT', 'INJUSDT', 'FTMUSDT', 'THETAUSDT', 'ALGOUSDT',
  'XTZUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'EGLDUSDT',
  'FLOWUSDT', 'CHZUSDT', 'APEUSDT', 'GALAUSDT', 'RUNEUSDT',
];

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

export async function GET() {
  const limit = 365;

  // Fetch in batches
  const allKlines: Map<string, number[][]> = new Map();
  const batchSize = 10;

  for (let i = 0; i < ALTCOINS.length; i += batchSize) {
    const batch = ALTCOINS.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((s) => fetchKlines(s, limit)));
    batch.forEach((s, idx) => {
      if (results[idx] && results[idx]!.length > 0) allKlines.set(s, results[idx]!);
    });
  }

  if (allKlines.size === 0) {
    return NextResponse.json({ error: 'No data fetched' }, { status: 500 });
  }

  // Use the reference dates from the first symbol
  const allEntries = Array.from(allKlines.entries());
  const refKlines = allEntries[0][1];
  const dates = refKlines.map((k: any) => new Date(k[0]).toISOString().split('T')[0]);

  // Build an equal-weighted index (normalized to 100 at start)
  // For each symbol: compute daily return, then average across all symbols
  const indexValues: number[] = [];
  let indexValue = 100;

  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      indexValues.push(100);
      continue;
    }

    let totalReturn = 0;
    let count = 0;

    for (const [, klines] of allEntries) {
      if (i < klines.length && i - 1 < klines.length) {
        const prevClose = parseFloat(klines[i - 1][4] as any);
        const currClose = parseFloat(klines[i][4] as any);
        if (prevClose > 0) {
          totalReturn += (currClose - prevClose) / prevClose;
          count++;
        }
      }
    }

    const avgReturn = count > 0 ? totalReturn / count : 0;
    indexValue *= 1 + avgReturn;
    indexValues.push(indexValue);
  }

  const result = dates.map((date, i) => ({
    date,
    value: parseFloat(indexValues[i].toFixed(4)),
    daily_return: i > 0 ? parseFloat(((indexValues[i] / indexValues[i - 1] - 1) * 100).toFixed(4)) : 0,
    num_constituents: allKlines.size,
  }));

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  });
}
