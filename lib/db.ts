import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';

// node-postgres + koneksi pooled (-pooler), sesuai panduan Neon untuk aplikasi di Vercel.
// Pool dibuat saat pertama dipakai (bukan saat build). Hanya untuk kode server.
let pool: Pool | undefined;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL belum diisi.');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    attachDatabasePool(pool); // menutup koneksi menganggur dengan benar di Vercel Fluid compute
  }
  return pool;
}

// Query bertag: nilai di dalam ${...} selalu dikirim sebagai parameter ($1, $2, ...), bukan digabung ke teks SQL.
export async function query<T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  const text = strings.reduce((acc, s, i) => acc + (i === 0 ? '' : `$${i}`) + s, '');
  const res = await getPool().query(text, values);
  return res.rows as T[];
}
