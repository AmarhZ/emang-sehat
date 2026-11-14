-- 0001: skema awal
create table if not exists products (
  id integer generated always as identity primary key,
  nama text not null,
  merek text not null default '',
  ukuran_ml double precision not null check (ukuran_ml > 0),
  gula_g double precision not null default 0 check (gula_g >= 0),
  natrium_mg double precision not null default 0 check (natrium_mg >= 0),
  lemak_jenuh_g double precision not null default 0 check (lemak_jenuh_g >= 0),
  kalori double precision not null default 0 check (kalori >= 0),
  pemanis text not null default 'none' check (pemanis in ('none','alami','buatan')),
  komposisi text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  produk jsonb not null,
  hasil jsonb not null,
  grade text not null check (grade in ('A','B','C','D'))
);
create index if not exists analyses_created_idx on analyses (created_at desc);

create table if not exists admins (
  id integer generated always as identity primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);
