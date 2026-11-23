import Link from 'next/link';
import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { logout } from './actions';

export const metadata: Metadata = { title: 'Admin – Emang Sehat?', robots: { index: false, follow: false } };

// Layout admin sendiri: terpisah dari situs publik (tanpa navigasi dan footer pengunjung).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <header className="admin-head">
        <Link href="/admin" className="brand">Emang Sehat? <span className="tag">Admin</span></Link>
        {session && (
          <nav aria-label="Menu admin">
            <Link href="/admin">Produk</Link>
            <Link href="/admin/analisis">Riwayat analisis</Link>
            <Link href="/" target="_blank" rel="noreferrer">Lihat situs ↗</Link>
            <form action={logout}><button type="submit">Keluar</button></form>
          </nav>
        )}
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
