import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query(
      'SELECT date, btc_dominance, eth_dominance, total_market_cap, total_volume_24h, active_cryptocurrencies FROM crypto_models_cryptoglobalquote ORDER BY date'
    );
    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
