import { NextRequest, NextResponse } from 'next/server';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || 'BTCUSDT').toUpperCase();
  const interval = searchParams.get('interval') || '1d';
  const limit = Math.min(Number(searchParams.get('limit') || '500'), 1000);

  const url = `${BINANCE_BASE}/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'Binance API error', detail: err }, { status: res.status });
    }

    const raw: any[] = await res.json();
    const candles = raw.map((k: any) => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6],
    }));

    return NextResponse.json(candles, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
