import { login } from '../actions';

export const metadata = { title: 'Masuk admin – Emang Sehat?' };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <form className="card login" action={login}>
      <h2 style={{ fontSize: '1.6rem' }}>Masuk admin</h2>
      <p><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="username" /></p>
      <p><label htmlFor="password">Kata sandi</label><input id="password" name="password" type="password" required autoComplete="current-password" /></p>
      {error && <p className="err" role="alert">Email atau kata sandi salah.</p>}
      <button className="btn" type="submit">Masuk</button>
    </form>
  );
}
