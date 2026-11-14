'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PEMANIS_LABEL, type Pemanis } from '@/lib/grading';

type F = { nama: string; merek: string; ukuran_ml: string; kalori: string; gula_g: string; natrium_mg: string; lemak_jenuh_g: string; pemanis: Pemanis; komposisi: string };
const EMPTY: F = { nama: '', merek: '', ukuran_ml: '', kalori: '', gula_g: '', natrium_mg: '', lemak_jenuh_g: '', pemanis: 'none', komposisi: '' };

// Perkecil gambar agar unggahan ringan dan cepat dibaca.
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
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Gambar tidak bisa dibuka.'));
    img.src = url;
  });
}

export default function AnalysisForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const [f, setF] = useState<F>(EMPTY);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState<'' | 'ocr' | 'save'>('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setNote('');
    try { setPreview(await downscale(file)); } catch (err) { setError((err as Error).message); }
  }

  async function readLabel() {
    if (!preview) { setError('Unggah gambar label terlebih dahulu.'); return; }
    setBusy('ocr'); setError(''); setNote('');
    try {
      const r = await fetch('/api/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: preview }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal membaca label.');
      setF((old) => ({
        ...old,
        ...Object.fromEntries(Object.entries(d.data).filter(([, v]) => v !== null && v !== '').map(([k, v]) => [k, String(v)])),
      }));
      setNote('Label terbaca. Periksa angkanya sebelum menganalisis.');
    } catch (err) { setError((err as Error).message); }
    setBusy('');
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

  return (
    <>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'manual'} onClick={() => setMode('manual')}>Input manual</button>
        <button type="button" role="tab" aria-selected={mode === 'scan'} onClick={() => setMode('scan')}>Scan atau unggah gambar</button>
      </div>

      {mode === 'scan' && (
        <div className="drop">
          <p style={{ marginBottom: 8 }}><b>Unggah foto label gizi</b><br /><span className="hint">Pastikan tabel gizi terlihat jelas dan tidak buram.</span></p>
          <input type="file" accept="image/*" capture="environment" onChange={onFile} style={{ maxWidth: 300 }} aria-label="Pilih foto label gizi" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Pratinjau label gizi" />}
          <p style={{ margin: '12px auto 0' }}>
            <button type="button" className="btn sm" onClick={readLabel} disabled={busy === 'ocr'}>{busy === 'ocr' ? 'Membaca label…' : 'Baca label otomatis'}</button>
          </p>
          {note && <p className="hint" style={{ margin: '8px auto 0' }}>{note}</p>}
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
