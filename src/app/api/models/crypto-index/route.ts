import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  const index = req.nextUrl.searchParams.get('index') || 'alt100';

  try {
    const { rows } = await pool.query(
      'SELECT date, value, daily_return, num_constituents FROM crypto_models_cryptoindex WHERE index_name = $1 ORDER BY date',
      [index]
    );
    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
