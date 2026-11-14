import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE, MAX_AGE, signToken, verifyToken } from './session';

export async function createSession(email: string) {
  (await cookies()).set(COOKIE, await signToken(email), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession() {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect('/admin/login');
  return s;
}
