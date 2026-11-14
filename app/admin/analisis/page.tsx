import Link from 'next/link';
import AdminBar from '@/components/AdminBar';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { fmt, type Minuman } from '@/lib/grading';

export const metadata = { title: 'Riwayat analisis – Emang Sehat?' };
export const dynamic = 'force-dynamic';

export default async function Riwayat() {
  await requireAdmin();
  const data = await query<{ id: string; created_at: Date; produk: Minuman; grade: string }>`select id, created_at, produk, grade from analyses order by created_at desc limit 100`;
  return (
    <>
      <AdminBar title="Riwayat analisis" />
      <div className="card scroll" style={{ padding: '8px 16px' }}>
        {!data.length ? <div className="empty">Belum ada analisis dari pengunjung.</div> : (
          <table>
            <thead><tr><th>Waktu</th><th>Produk</th><th>Ukuran</th><th>Grade</th><th></th></tr></thead>
            <tbody>
              {data.map((r) => {
                const p = r.produk as Minuman;
                return (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td><b>{p.nama}</b><br /><span className="hint">{p.merek}</span></td>
                    <td>{fmt(p.ukuran_ml)} ml</td>
                    <td><span className={`pill g${r.grade}`}>{r.grade}</span></td>
                    <td><Link className="btn sm alt" href={`/hasil/${r.id}`}>Lihat hasil</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
