// Menjalankan file di db/migrations secara berurutan. Tiap file hanya dijalankan sekali.
// Pakai: npm run db:migrate
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';

// Migrasi memakai koneksi direct (tanpa -pooler), sesuai panduan Neon.
let url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL belum diisi di .env.local'); process.exit(1); }
url = url.replace('-pooler', '');

const dir = new URL('../db/migrations/', import.meta.url).pathname;
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const done = new Set((await client.query('select name from schema_migrations')).rows.map((r) => r.name));
  for (const f of (await readdir(dir)).filter((x) => x.endsWith('.sql')).sort()) {
    if (done.has(f)) { console.log('lewati  ', f); continue; }
    await client.query('begin');
    try {
      await client.query(await readFile(join(dir, f), 'utf8'));
      await client.query('insert into schema_migrations (name) values ($1)', [f]);
      await client.query('commit');
      console.log('dijalankan', f);
    } catch (e) {
      await client.query('rollback');
      throw new Error(`${f} gagal: ${e.message}`);
    }
  }
} finally {
  await client.end();
}
