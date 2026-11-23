import Nav from '@/components/Nav';

// Layout situs publik: navigasi pengunjung + footer. Halaman admin TIDAK memakai layout ini.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="wrap">{children}</main>
      <footer>Emang Sehat? – acuan penilaian diadaptasi dari lampiran Kepmenkes HK.01.07/MENKES/301/2026. Hasil bersifat panduan, bukan saran medis.</footer>
    </>
  );
}
