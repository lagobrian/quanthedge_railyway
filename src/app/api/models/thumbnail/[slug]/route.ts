import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const { rows } = await pool.query(
      'SELECT image FROM model_thumbnails WHERE slug = $1',
      [slug]
    );

    if (rows.length === 0) {
      return new NextResponse('Not found', { status: 404 });
    }

    const imageBuffer = rows[0].image;
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
