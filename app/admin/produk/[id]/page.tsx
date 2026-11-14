import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminBar from '@/components/AdminBar';
import ResultView from '@/components/ResultView';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { Minuman } from '@/lib/grading';

export const dynamic = 'force-dynamic';

export default async function ProdukHasil({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [p] = await query<Minuman>`select nama, merek, ukuran_ml, gula_g, natrium_mg, lemak_jenuh_g, kalori, pemanis, komposisi from products where id = ${Number(id) || 0}`;
  if (!p) notFound();
  return (
    <>
      <AdminBar title="Hasil analisis produk" />
      <ResultView produk={p} actions={<Link className="btn alt" href="/admin">Kembali ke daftar</Link>} />
    </>
  );
}
