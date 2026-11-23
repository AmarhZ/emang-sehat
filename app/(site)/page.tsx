import Link from 'next/link';
import LiveSlider from '@/components/LiveSlider';

const kategori = [
  { g: 'A', c: 'gA', t: 'Hijau', d: 'Gula ≤ 1 g, garam ≤ 5 mg, lemak jenuh ≤ 0,7 g per 100 ml, tanpa pemanis tambahan.' },
  { g: 'B', c: 'gB', t: 'Kuning', d: 'Gula >1–5 g, garam >5–120 mg, lemak jenuh >0,7–1,2 g. Pemanis alami paling baik di sini.' },
  { g: 'C', c: 'gC', t: 'Oranye', d: 'Gula >5–10 g, garam >120–500 mg, lemak jenuh >1,2–2,8 g. Pemanis buatan paling baik di sini.' },
  { g: 'D', c: 'gD', t: 'Merah', d: 'Gula >10 g, garam >500 mg, atau lemak jenuh >2,8 g per 100 ml.' },
];

export default function Home() {
  return (
    <>
      <div className="hero">
        <div className="hero-in">
          <div>
            <h1>Emang sehat, minuman itu?</h1>
            <p style={{ fontSize: '1.1rem' }}>Masukkan angka dari label kemasan. Dalam hitungan detik, kamu tahu grade A sampai D berdasarkan kadar gula, garam, lemak jenuh, dan jenis pemanisnya.</p>
            <p>
              <Link className="btn" href="/analisis">Mulai analisis</Link>{' '}
              <a className="btn alt" href="#kategori">Lihat arti grade</a>
            </p>
          </div>
          <LiveSlider />
        </div>
      </div>

      <section className="blk">
        <h2>Cara kerjanya</h2>
        <div className="steps">
          <div><h3>Masukkan data</h3><p>Foto label kemasan atau ketik manual: ukuran, gula, natrium, lemak jenuh, kalori, dan pemanis.</p></div>
          <div><h3>Sistem menghitung</h3><p>Semua nilai disamakan ke per 100 ml, lalu tiap parameter dinilai. Grade akhir mengikuti parameter yang paling buruk.</p></div>
          <div><h3>Lihat hasilnya</h3><p>Kamu mendapat grade, alasan, rincian tiap parameter, dan saran seberapa sering boleh diminum.</p></div>
        </div>
      </section>

      <section className="blk" id="kategori">
        <h2>Arti grade A, B, C, D</h2>
        <div className="grades">
          {kategori.map((k) => (
            <div className="gcard" key={k.g}><b className={k.c}>{k.g} · {k.t}</b><div>{k.d}</div></div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Mau langsung coba?</h3>
        <p>Masukkan minumanmu sendiri atau unggah foto label gizinya.</p>
        <Link className="btn" href="/analisis">Mulai analisis</Link>
      </section>
    </>
  );
}
