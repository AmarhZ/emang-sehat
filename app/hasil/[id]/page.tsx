import Link from 'next/link';
import { notFound } from 'next/navigation';
import ResultView from '@/components/ResultView';
import { query } from '@/lib/db';
import type { Hasil, Minuman } from '@/lib/grading';

export const metadata = { title: 'Hasil klasifikasi – Emang Sehat?' };
export const dynamic = 'force-dynamic';

export default async function HasilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [row] = await query<{ produk: Minuman; hasil: Hasil }>`select produk, hasil from analyses where id = ${id}::uuid`;
  if (!row) notFound();

  return (
    <>
      <h2>Hasil klasifikasi</h2>
      <ResultView produk={row.produk} hasil={row.hasil} actions={<Link className="btn" href="/analisis">Analisis minuman lain</Link>} />
    </>
  );
}
