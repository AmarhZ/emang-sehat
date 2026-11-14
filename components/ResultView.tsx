import { GRADES, analyze, fmt, worstParams, type Hasil, type Minuman } from '@/lib/grading';
import GradePill from './GradePill';

const COL = ['var(--ga)', 'var(--gb)', 'var(--gc)', 'var(--gd)'];

export default function ResultView({ produk, hasil, actions }: { produk: Minuman; hasil?: Hasil; actions?: React.ReactNode }) {
  const h = hasil ?? analyze(produk);
  const g = h.grade;
  return (
    <div className="card">
      <div className="res-top">
        <div className={`big g${GRADES[g]}`} aria-label={`Grade ${GRADES[g]}`}>{GRADES[g]}</div>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: 4 }}>{produk.nama}</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            {produk.merek || 'Tanpa merek'} · {fmt(produk.ukuran_ml)} ml · {fmt(h.kalori100)} kkal/100 ml
          </p>
          <p style={{ margin: '10px 0 0' }}>
            <b>Grade {GRADES[g]}</b> karena {worstParams(h).map((x) => x.label.toLowerCase()).join(' dan ')} berada di tingkat {GRADES[g]}.
          </p>
        </div>
      </div>

      <h3>Rincian per parameter</h3>
      {h.params.map((x) => (
        <div className="row" key={x.key}>
          <div><b>{x.label}</b><small>{x.note}</small></div>
          <div className="bar" aria-hidden="true"><i style={{ width: `${(x.grade + 1) * 25}%`, background: COL[x.grade] }} /></div>
          <div><GradePill g={x.grade} /></div>
          <div className="val">{x.value === null ? x.unit : `${fmt(x.value)} ${x.unit}`}</div>
        </div>
      ))}

      <h3 style={{ marginTop: 24 }}>Alasan penilaian</h3>
      <ul style={{ margin: '0 0 20px', paddingLeft: 20 }}>{h.alasan.map((t) => <li key={t}>{t}</li>)}</ul>

      <div className="rec" style={{ borderColor: COL[g] }}>
        <b>Rekomendasi konsumsi</b><br />{h.rekomendasi}
      </div>

      {produk.komposisi && (<><h3 style={{ marginTop: 24 }}>Komposisi</h3><p style={{ color: 'var(--muted)' }}>{produk.komposisi}</p></>)}
      {actions && <p style={{ margin: '24px 0 0' }}>{actions}</p>}
    </div>
  );
}
