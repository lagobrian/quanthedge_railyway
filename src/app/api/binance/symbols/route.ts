import { NextResponse } from 'next/server';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

let cachedSymbols: { symbol: string; baseAsset: string; quoteAsset: string }[] | null = null;
let cachedAt = 0;
const CACHE_TTL = 300_000; // 5 minutes

export async function GET() {
  const now = Date.now();
  if (cachedSymbols && now - cachedAt < CACHE_TTL) {
    return NextResponse.json(cachedSymbols);
  }

  try {
    const res = await fetch(`${BINANCE_BASE}/exchangeInfo`, { next: { revalidate: 300 } });
    if (!res.ok) {
      return NextResponse.json({ error: 'Binance API error' }, { status: res.status });
    }

    const data = await res.json();
    cachedSymbols = data.symbols
      .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
      .map((s: any) => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
      }));
    cachedAt = now;

    return NextResponse.json(cachedSymbols, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
