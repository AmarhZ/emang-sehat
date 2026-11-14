import { NextResponse } from 'next/server';

const PROMPT = `Baca label informasi nilai gizi dan komposisi pada foto minuman kemasan ini.
Balas HANYA dengan satu objek JSON tanpa teks lain, dengan kunci persis:
{"nama":string|null,"merek":string|null,"ukuran_ml":number|null,"kalori":number|null,"gula_g":number|null,"natrium_mg":number|null,"lemak_jenuh_g":number|null,"pemanis":"none"|"alami"|"buatan","komposisi":string|null}
Aturan:
- Angka gizi harus sesuai satu kemasan atau satu sajian yang sama dengan ukuran_ml. Jika label memberi "per sajian", pakai ukuran sajian sebagai ukuran_ml.
- Natrium dalam mg. Jika yang tertulis garam, bagi dengan 2,5.
- pemanis: "buatan" jika ada aspartam, sukralosa, asesulfam-K, sakarin, siklamat; "alami" jika stevia, madu, atau sejenisnya tanpa pemanis buatan; selain itu "none".
- Jika sebuah nilai tidak terbaca, isi null. Jangan menebak.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'Fitur baca label belum dikonfigurasi di server.' }, { status: 503 });

  const { image } = await req.json().catch(() => ({ image: '' }));
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(String(image));
  if (!m) return NextResponse.json({ error: 'Format gambar tidak didukung.' }, { status: 400 });
  if (m[2].length > 6_000_000) return NextResponse.json({ error: 'Gambar terlalu besar.' }, { status: 413 });

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
        { type: 'text', text: PROMPT },
      ] }],
    }),
  });
  if (!r.ok) return NextResponse.json({ error: 'Label gagal dibaca. Coba foto yang lebih jelas.' }, { status: 502 });

  const out = await r.json();
  const text: string = (out.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('');
  const json = /\{[\s\S]*\}/.exec(text)?.[0];
  try {
    const d = JSON.parse(json ?? '');
    return NextResponse.json({ data: {
      nama: d.nama, merek: d.merek, ukuran_ml: d.ukuran_ml, kalori: d.kalori, gula_g: d.gula_g,
      natrium_mg: d.natrium_mg, lemak_jenuh_g: d.lemak_jenuh_g,
      pemanis: ['none', 'alami', 'buatan'].includes(d.pemanis) ? d.pemanis : 'none', komposisi: d.komposisi,
    } });
  } catch {
    return NextResponse.json({ error: 'Label tidak terbaca. Coba foto yang lebih jelas atau isi manual.' }, { status: 422 });
  }
}
