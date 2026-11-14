// Aman dipakai di middleware (Edge): hanya memakai jose.
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE = 'es_session';
export const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

const key = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET harus diisi, minimal 32 karakter.');
  return new TextEncoder().encode(s);
};

export const signToken = (email: string) =>
  new SignJWT({ email }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());

export async function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as { email: string };
  } catch {
    return null;
  }
}
