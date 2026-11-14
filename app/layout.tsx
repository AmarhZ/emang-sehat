import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Emang Sehat? – Cek kesehatan minuman kemasan',
  description: 'Masukkan data gizi minuman dan dapatkan grade A sampai D berdasarkan kadar gula, garam, lemak jenuh, dan pemanis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Nav />
        <main className="wrap">{children}</main>
        <footer>Emang Sehat? – acuan penilaian diadaptasi dari lampiran Kepmenkes HK.01.07/MENKES/301/2026. Hasil bersifat panduan, bukan saran medis.</footer>
      </body>
    </html>
  );
}
