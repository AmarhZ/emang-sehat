// Pakai: npm run create-admin -- email@contoh.com "kata-sandi-minimal-8-karakter"
import pg from 'pg';
import bcrypt from 'bcryptjs';

const [email, password] = process.argv.slice(2);
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL belum diisi di .env.local'); process.exit(1); }
if (!email || !password || password.length < 8) {
  console.error('Pakai: npm run create-admin -- email@contoh.com "kata-sandi-minimal-8-karakter"');
  process.exit(1);
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const hash = await bcrypt.hash(password, 12);
  await client.query(
    `insert into admins (email, password_hash) values ($1, $2)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [email.toLowerCase(), hash],
  );
  console.log('Admin siap dipakai:', email.toLowerCase());
} finally {
  await client.end();
}
