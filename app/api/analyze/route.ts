import { NextResponse } from 'next/server';
import { analyze, parseMinuman, GRADES } from '@/lib/grading';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 }); }

  const produk = parseMinuman(body);
  if (typeof produk === 'string') return NextResponse.json({ error: produk }, { status: 400 });

  const hasil = analyze(produk);
  try {
    const [row] = await query<{ id: string }>`
      insert into analyses (produk, hasil, grade)
      values (${JSON.stringify(produk)}::jsonb, ${JSON.stringify(hasil)}::jsonb, ${GRADES[hasil.grade]})
      returning id`;
    return NextResponse.json({ id: row.id });
  } catch {
    return NextResponse.json({ error: 'Hasil tidak bisa disimpan. Coba lagi.' }, { status: 500 });
  }
}
