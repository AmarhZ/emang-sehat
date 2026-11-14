'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { PEMANIS_LABEL, analyze, fmt, type Minuman, type Pemanis } from '@/lib/grading';
import { deleteProduct, saveProduct } from '@/app/admin/actions';
import GradePill from './GradePill';

export type Produk = Minuman & { id: number };
const BLANK: Partial<Produk> = { nama: '', merek: '', pemanis: 'none', komposisi: '' };

export default function ProductTable({ products }: { products: Produk[] }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [edit, setEdit] = useState<Partial<Produk>>(BLANK);
  const [error, setError] = useState('');
  const open = (p?: Produk) => { setEdit(p ?? BLANK); setError(''); dlg.current?.showModal(); };
  const v = (x: number | string | undefined) => (x === undefined ? '' : String(x));

  const rows = products.map((p) => ({ p, h: analyze(p) }));
  const cnt = [0, 0, 0, 0];
  rows.forEach((r) => cnt[r.h.grade]++);
  const COL = ['var(--ga)', 'var(--gb)', 'var(--gc)', 'var(--gd)'];

  return (
    <>
      <div className="bar-head" style={{ marginTop: -8 }}>
        <span />
        <button className="btn" onClick={() => open()}>Tambah produk</button>
      </div>

      <div className="stats">
        <div><b>{products.length}</b>Total produk</div>
        {cnt.map((c, i) => <div key={i} style={{ borderTop: `4px solid ${COL[i]}` }}><b>{c}</b>Grade {'ABCD'[i]}</div>)}
      </div>

      <div className="card scroll" style={{ padding: '8px 16px' }}>
        {products.length === 0 ? <div className="empty">Belum ada produk. Tambahkan produk pertama.</div> : (
          <table>
            <thead><tr><th>Produk</th><th>Ukuran</th><th>Gula/100 ml</th><th>Garam/100 ml</th><th>Lemak jenuh/100 ml</th><th>Pemanis</th><th>Grade</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map(({ p, h }) => (
                <tr key={p.id}>
                  <td><b>{p.nama}</b><br /><span className="hint">{p.merek}</span></td>
                  <td>{fmt(p.ukuran_ml)} ml</td>
                  <td>{fmt(h.params[0].value!)} g</td>
                  <td>{fmt(h.params[1].value!)} mg</td>
                  <td>{fmt(h.params[2].value!)} g</td>
                  <td>{PEMANIS_LABEL[p.pemanis]}</td>
                  <td><GradePill g={h.grade} /></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <Link className="btn sm alt" href={`/admin/produk/${p.id}`}>Lihat hasil</Link>
                    <button className="btn sm alt" onClick={() => open(p)}>Edit</button>
                    <form action={deleteProduct} onSubmit={(e) => { if (!confirm(`Hapus “${p.nama}” dari database?`)) e.preventDefault(); }}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn sm del" type="submit">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <dialog ref={dlg}>
        <form
          key={edit.id ?? 'baru'}
          action={async (fd) => {
            try { await saveProduct(fd); dlg.current?.close(); } catch (e) { setError((e as Error).message); }
          }}
        >
          <h3>{edit.id ? 'Edit produk' : 'Tambah produk'}</h3>
          <input type="hidden" name="id" defaultValue={edit.id ?? ''} />
          <div className="grid">
            <div><label>Nama produk<input name="nama" required defaultValue={v(edit.nama)} /></label></div>
            <div><label>Merek<input name="merek" defaultValue={v(edit.merek)} /></label></div>
            <div><label>Ukuran (ml)<input name="ukuran_ml" inputMode="decimal" required defaultValue={v(edit.ukuran_ml)} /></label></div>
            <div><label>Kalori (kkal)<input name="kalori" inputMode="decimal" defaultValue={v(edit.kalori)} /></label></div>
            <div><label>Gula (g)<input name="gula_g" inputMode="decimal" required defaultValue={v(edit.gula_g)} /></label></div>
            <div><label>Natrium (mg)<input name="natrium_mg" inputMode="decimal" required defaultValue={v(edit.natrium_mg)} /></label></div>
            <div><label>Lemak jenuh (g)<input name="lemak_jenuh_g" inputMode="decimal" required defaultValue={v(edit.lemak_jenuh_g)} /></label></div>
            <div><label>Jenis pemanis
              <select name="pemanis" defaultValue={edit.pemanis ?? 'none'}>
                {(Object.keys(PEMANIS_LABEL) as Pemanis[]).map((k) => <option key={k} value={k}>{PEMANIS_LABEL[k]}</option>)}
              </select></label></div>
            <div className="full"><label>Komposisi<textarea name="komposisi" rows={2} defaultValue={v(edit.komposisi)} /></label></div>
          </div>
          {error && <p className="err" role="alert">{error}</p>}
          <p style={{ margin: '16px 0 0' }}>
            <button className="btn" type="submit">{edit.id ? 'Simpan perubahan' : 'Tambah produk'}</button>{' '}
            <button className="btn alt" type="button" onClick={() => dlg.current?.close()}>Batal</button>
          </p>
        </form>
      </dialog>
    </>
  );
}
