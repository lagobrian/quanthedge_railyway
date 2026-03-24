import { NextResponse } from 'next/server';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

// Major coins to compute relative dominance
const TRACKED = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'TRXUSDT',
  'LINKUSDT', 'MATICUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
  'UNIUSDT', 'XLMUSDT', 'ETCUSDT', 'NEARUSDT', 'APTUSDT',
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

  const allKlines: Map<string, number[][]> = new Map();
  const batchSize = 10;
  for (let i = 0; i < TRACKED.length; i += batchSize) {
    const batch = TRACKED.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((s) => fetchKlines(s, limit)));
    batch.forEach((s, idx) => {
      if (results[idx] && results[idx]!.length > 0) allKlines.set(s, results[idx]!);
    });
  }

  const btcKlines = allKlines.get('BTCUSDT');
  const ethKlines = allKlines.get('ETHUSDT');
  if (!btcKlines || !ethKlines) {
    return NextResponse.json({ error: 'Could not fetch BTC/ETH data' }, { status: 500 });
  }

  const dates = btcKlines.map((k) => new Date(k[0]).toISOString().split('T')[0]);

  // Compute BTC and ETH "volume dominance" as proxy for dominance
  // Using close * volume as a weight proxy
  const result = dates.map((date, i) => {
    let totalWeight = 0;
    let btcWeight = 0;
    let ethWeight = 0;

    for (const [sym, klines] of Array.from(allKlines.entries())) {
      if (i < klines.length) {
        const close = parseFloat(klines[i][4] as any);
        const volume = parseFloat(klines[i][5] as any);
        const weight = close * volume;
        totalWeight += weight;
        if (sym === 'BTCUSDT') btcWeight = weight;
        if (sym === 'ETHUSDT') ethWeight = weight;
      }
    }

    const btcPrice = i < btcKlines.length ? parseFloat(btcKlines[i][4] as any) : 0;
    const ethPrice = i < ethKlines.length ? parseFloat(ethKlines[i][4] as any) : 0;

    return {
      date,
      btc_dominance: totalWeight > 0 ? parseFloat(((btcWeight / totalWeight) * 100).toFixed(2)) : 0,
      eth_dominance: totalWeight > 0 ? parseFloat(((ethWeight / totalWeight) * 100).toFixed(2)) : 0,
      btc_price: btcPrice,
      eth_price: ethPrice,
      active_pairs: allKlines.size,
    };
  });

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  });
}
