# Emang Sehat?

Website untuk menilai kesehatan minuman kemasan (grade A–D) dari kadar gula, garam, lemak jenuh, dan jenis pemanis.
Stack: Next.js 15 (App Router, TypeScript) + Neon Postgres lewat node-postgres (`pg`).

## Menjalankan

Project ini sudah ditautkan ke Neon lewat `neon init` (lihat `.neon`, `neon.ts`, dan skill agent di `.agents/skills`).

1. `npm install`
2. Pasang CLI dan masuk: `npm i -g neon@latest`, lalu `neon login`.
3. Tarik variabel lingkungan ke `.env.local`: `neon env pull`. Pastikan `DATABASE_URL` terisi (pooled).
   Tambahkan `SESSION_SECRET` (acak, minimal 32 karakter, misalnya hasil `openssl rand -base64 32`).
   `ANTHROPIC_API_KEY` opsional, hanya untuk fitur "Baca label otomatis".
4. Buat tabel dan data contoh: `npm run db:migrate`
   (file ada di `db/migrations`, dijalankan berurutan dan hanya sekali, lewat koneksi direct).
5. Buat akun admin: `npm run create-admin -- email@contoh.com "kata-sandi-minimal-8-karakter"`
6. `npm run dev`, buka http://localhost:3000, admin ada di `/admin`.

Perubahan skema berikutnya: tambahkan file baru, misalnya `db/migrations/0003_nama.sql`, lalu jalankan `npm run db:migrate`.
Uji dulu di branch Neon (`neon checkout dev --create`) sebelum menerapkannya ke production.

## Struktur

| Bagian | File |
| --- | --- |
| Logika penilaian (normalisasi, ambang batas, grade akhir) | `lib/grading.ts` |
| Koneksi database Neon (pooled) | `lib/db.ts` |
| Skema dan migrasi | `db/migrations/*.sql`, `scripts/migrate.mjs`, konfigurasi Neon di `neon.ts` |
| Login admin (bcrypt + sesi JWT di cookie HttpOnly) | `lib/session.ts`, `lib/auth.ts`, `app/admin/actions.ts` |
| Proteksi halaman admin | `middleware.ts` dan `requireAdmin()` di tiap halaman admin |
| Beranda | `app/page.tsx` |
| Input + scan gambar | `app/analisis/page.tsx`, `components/AnalysisForm.tsx`, `app/api/ocr/route.ts` |
| Analisis + simpan hasil | `app/api/analyze/route.ts` |
| Hasil klasifikasi | `app/hasil/[id]/page.tsx`, `components/ResultView.tsx` |
| Dashboard admin (CRUD produk, riwayat) | `app/admin/*`, `components/ProductTable.tsx` |

## Catatan keamanan

- Semua akses database lewat kode server. `DATABASE_URL`, `SESSION_SECRET`, dan `ANTHROPIC_API_KEY` tidak boleh diberi awalan `NEXT_PUBLIC_`.
- Neon tidak punya RLS bawaan seperti Supabase, jadi hak akses dijaga di aplikasi: setiap server action dan halaman admin memanggil `requireAdmin()`.
- Kata sandi disimpan sebagai hash bcrypt. Sesi berlaku 7 hari. Belum ada pembatasan percobaan login, jadi sebelum dipublikasikan sebaiknya tambahkan rate limit (misalnya lewat Vercel Firewall).
- Halaman hasil publik memakai UUID yang sulit ditebak. Riwayat analisis hanya tampil di admin.

## Deploy

Push ke GitHub, impor ke Vercel, isi environment variable yang sama (`DATABASE_URL` pooled dan `SESSION_SECRET`). Jalankan `db:migrate` dan `create-admin` sekali dari komputermu dengan `DATABASE_URL` yang sama.
