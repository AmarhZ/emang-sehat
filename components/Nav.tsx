'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Beranda' },
  { href: '/analisis', label: 'Analisis' },
  { href: '/admin', label: 'Admin' },
];

export default function Nav() {
  const path = usePathname();
  const active = (h: string) => (h === '/' ? path === '/' : path.startsWith(h));
  return (
    <nav>
      <Link className="logo" href="/">Emang Sehat?</Link>
      <ul>
        {items.map((i) => (
          <li key={i.href}>
            <Link className="l" href={i.href} aria-current={active(i.href) ? 'page' : undefined}>{i.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
