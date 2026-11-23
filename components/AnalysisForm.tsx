'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PEMANIS_LABEL, type Pemanis } from '@/lib/grading';
import CameraCapture from './CameraCapture';
import { readLabelText } from '@/lib/ocr';
import { parseLabel } from '@/lib/labelParser';

type F = { nama: string; merek: string; ukuran_ml: string; kalori: string; gula_g: string; natrium_mg: string; lemak_jenuh_g: string; pemanis: Pemanis; komposisi: string };
const EMPTY: F = { nama: '', merek: '', ukuran_ml: '', kalori: '', gula_g: '', natrium_mg: '', lemak_jenuh_g: '', pemanis: 'none', komposisi: '' };
const LABELS: Record<keyof F, string> = { nama: 'nama', merek: 'merek', ukuran_ml: 'ukuran', kalori: 'kalori', gula_g: 'gula', natrium_mg: 'natrium', lemak_jenuh_g: 'lemak jenuh', pemanis: 'pemanis', komposisi: 'komposisi' };
const NEEDED: (keyof F)[] = ['ukuran_ml', 'gula_g', 'natrium_mg', 'lemak_jenuh_g'];

// Perkecil gambar dari file agar unggahan ringan dan cepat dibaca.
function downscale(file: File, max = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => reject(new Error('Gambar tidak bisa dibuka.'));
    img.src = url;
  });
}

export default function AnalysisForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const [f, setF] = useState<F>(EMPTY);
  const [preview, setPreview] = useState('');
  const [camOpen, setCamOpen] = useState(false);
  const [busy, setBusy] = useState<'' | 'ocr' | 'save'>('');
  const [error, setError] = useState('');
  const [scanError, setScanError] = useState('');
  const [filled, setFilled] = useState<(keyof F)[] | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [rawText, setRawText] = useState('');
  const [progress, setProgress] = useState({ pct: 0, label: '' });

  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  // Baca teks label dengan OCR (Tesseract.js) di browser, lalu isi form dari hasilnya.
  async function scan(image: string) {
    setPreview(image); setBusy('ocr'); setScanError(''); setFilled(null); setNotes([]); setRawText('');
    setProgress({ pct: 0, label: 'Menyiapkan…' });
    try {
      const text = await readLabelText(image, (pct, label) => setProgress({ pct, label }));
      setRawText(text);
      const p = parseLabel(text);
      setF((old) => ({ ...old, ...Object.fromEntries(Object.entries(p.data).map(([k, v]) => [k, String(v)])) }));
      setFilled(p.found as (keyof F)[]);
      setNotes(p.notes);
    } catch {
      setScanError('Pembacaan gagal. Pastikan perangkat terhubung ke internet (data bahasa diunduh sekali), lalu coba lagi.');
    }
    setBusy('');
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { await scan(await downscale(file)); } catch (err) { setScanError((err as Error).message); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!f.nama.trim() || !f.ukuran_ml || f.gula_g === '' || f.natrium_mg === '' || f.lemak_jenuh_g === '') {
      setError('Lengkapi nama, ukuran kemasan, gula, natrium, dan lemak jenuh. Isi 0 jika tidak ada.');
      return;
    }
    setBusy('save');
    try {
      const r = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Analisis gagal.');
      router.push(`/hasil/${d.id}`);
    } catch (err) { setError((err as Error).message); setBusy(''); }
  }

  const input = (id: keyof F, label: string, ph: string, extra?: React.ReactNode, mode?: 'decimal') => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={f[id]} onChange={set(id)} placeholder={ph} inputMode={mode} />
      {extra}
    </div>
  );

  const missing = filled ? NEEDED.filter((k) => !filled.includes(k)) : [];

  return (
    <>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'manual'} onClick={() => setMode('manual')}>Input manual</button>
        <button type="button" role="tab" aria-selected={mode === 'scan'} onClick={() => setMode('scan')}>Scan label (kamera atau gambar)</button>
      </div>

      {mode === 'scan' && (
        <div className="drop">
          <p style={{ marginBottom: 8 }}><b>Scan label gizi dengan OCR</b><br /><span className="hint">Foto tabel “Informasi Nilai Gizi” dan komposisi. Teksnya dibaca di browsermu (Tesseract.js), lalu angkanya mengisi formulir di bawah. Nama dan merek diisi manual.</span></p>

          {camOpen ? (
            <CameraCapture onClose={() => setCamOpen(false)} onCapture={(img) => { setCamOpen(false); scan(img); }} />
          ) : (
            <div className="scan-actions">
              <button type="button" className="btn" onClick={() => { setScanError(''); setCamOpen(true); }} disabled={busy === 'ocr'}>Buka kamera</button>
              <button type="button" className="btn alt" onClick={() => fileRef.current?.click()} disabled={busy === 'ocr'}>Unggah gambar</button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden aria-label="Pilih foto label gizi" />
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && !camOpen && <img src={preview} alt="Foto label yang dipindai" />}
          {busy === 'ocr' && (
            <div role="status" style={{ margin: '8px auto', maxWidth: 360 }}>
              <p style={{ margin: '0 auto 4px' }}><b>{progress.label}</b></p>
              <progress value={progress.pct} max={100} style={{ width: '100%' }} />
            </div>
          )}
          {scanError && (
            <p className="err" role="alert" style={{ margin: '8px auto' }}>
              {scanError}{preview && <> <button type="button" className="btn sm alt" onClick={() => scan(preview)}>Coba lagi</button></>}
            </p>
          )}
          {filled && (
            <div style={{ margin: '8px auto' }} role="status">
              <p className="hint" style={{ margin: '0 auto 4px' }}>Terbaca: {filled.length ? filled.map((k) => <span className="filled" key={k}>{LABELS[k]}</span>) : 'tidak ada data yang terbaca'}</p>
              {missing.length > 0
                ? <p className="err" style={{ margin: 0 }}>Belum terbaca: {missing.map((k) => LABELS[k]).join(', ')}. Isi manual di bawah, atau foto ulang dengan cahaya lebih terang dan teks lurus.</p>
                : <p className="hint" style={{ margin: 0 }}>Periksa angkanya di bawah sebelum menganalisis.</p>}
              {notes.map((n) => <p className="hint" style={{ margin: '4px auto 0' }} key={n}>{n}</p>)}
              {rawText && <details style={{ marginTop: 8, textAlign: 'left', maxWidth: 520, marginInline: 'auto' }}><summary className="hint">Lihat teks mentah hasil OCR</summary><pre style={{ whiteSpace: 'pre-wrap', fontSize: '.8rem', margin: '6px 0 0' }}>{rawText}</pre></details>}
            </div>
          )}
        </div>
      )}

      <form className="card" onSubmit={submit} noValidate>
        <div className="grid">
          {input('nama', 'Nama produk', 'Contoh: Teh Melati Botol')}
          {input('merek', 'Merek', 'Contoh: Kebun Teh')}
          {input('ukuran_ml', 'Ukuran kemasan (ml)', '350', undefined, 'decimal')}
          {input('kalori', 'Kalori (kkal)', '84', undefined, 'decimal')}
          {input('gula_g', 'Gula (g)', '21', undefined, 'decimal')}
          {input('natrium_mg', 'Natrium (mg)', '20', <div className="hint">Garam = natrium × 2,5</div>, 'decimal')}
          {input('lemak_jenuh_g', 'Lemak jenuh (g)', '0', undefined, 'decimal')}
          <div>
            <label htmlFor="pemanis">Jenis pemanis</label>
            <select id="pemanis" value={f.pemanis} onChange={set('pemanis')}>
              {(Object.keys(PEMANIS_LABEL) as Pemanis[]).map((k) => <option key={k} value={k}>{PEMANIS_LABEL[k]}</option>)}
            </select>
            <div className="hint">Contoh alami: stevia, madu. Buatan: aspartam, sukralosa.</div>
          </div>
          <div className="full">
            <label htmlFor="komposisi">Komposisi atau bahan tambahan pangan</label>
            <textarea id="komposisi" rows={3} value={f.komposisi} onChange={set('komposisi')} placeholder="Air, gula, ekstrak teh, perisa, pengatur keasaman" />
          </div>
        </div>
        {error && <p className="err" role="alert">{error}</p>}
        <p style={{ margin: '16px 0 0' }}>
          <button className="btn" type="submit" disabled={busy !== ''}>{busy === 'save' ? 'Menganalisis…' : 'Analisis minuman'}</button>
        </p>
      </form>
    </>
  );
}
