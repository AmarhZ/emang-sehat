'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createSession, destroySession, requireAdmin } from '@/lib/auth';
import { parseMinuman } from '@/lib/grading';

let DUMMY: string | undefined;

export async function login(fd: FormData) {
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  const [row] = await query<{ password_hash: string }>`select password_hash from admins where email = ${email}`;
  // Tetap membandingkan hash palsu bila email tidak ada, agar waktu respons tidak membocorkan akun.
  const ok = await bcrypt.compare(password, row?.password_hash ?? (DUMMY ??= bcrypt.hashSync('dummy-password', 12)));
  if (!row || !ok) redirect('/admin/login?error=1');
  await createSession(email);
  redirect('/admin');
}

export async function logout() {
  await destroySession();
  redirect('/admin/login');
}

export async function saveProduct(fd: FormData) {
  await requireAdmin();
  const p = parseMinuman(Object.fromEntries(fd));
  if (typeof p === 'string') throw new Error(p);
  const id = Number(fd.get('id'));
  if (id) {
    await query`update products set nama=${p.nama}, merek=${p.merek}, ukuran_ml=${p.ukuran_ml}, gula_g=${p.gula_g},
      natrium_mg=${p.natrium_mg}, lemak_jenuh_g=${p.lemak_jenuh_g}, kalori=${p.kalori}, pemanis=${p.pemanis}, komposisi=${p.komposisi}
      where id=${id}`;
  } else {
    await query`insert into products (nama, merek, ukuran_ml, gula_g, natrium_mg, lemak_jenuh_g, kalori, pemanis, komposisi)
      values (${p.nama}, ${p.merek}, ${p.ukuran_ml}, ${p.gula_g}, ${p.natrium_mg}, ${p.lemak_jenuh_g}, ${p.kalori}, ${p.pemanis}, ${p.komposisi})`;
  }
  revalidatePath('/admin');
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  await query`delete from products where id=${Number(fd.get('id'))}`;
  revalidatePath('/admin');
}
