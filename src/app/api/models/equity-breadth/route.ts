import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT date, pct_above_50dma, pct_above_100dma, pct_above_200dma, pct_outperforming_spx
       FROM crypto_models_equitybreadth
       ORDER BY date`
    );
    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
