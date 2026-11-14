import Link from 'next/link';
import { logout } from '@/app/admin/actions';

export default function AdminBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <>
      <div className="sub">
        <Link className="btn sm alt" href="/admin">Produk</Link>
        <Link className="btn sm alt" href="/admin/analisis">Riwayat analisis</Link>
        <form action={logout}><button className="btn sm alt" type="submit">Keluar</button></form>
      </div>
      <div className="bar-head"><h2 style={{ margin: 0 }}>{title}</h2>{children}</div>
    </>
  );
}
