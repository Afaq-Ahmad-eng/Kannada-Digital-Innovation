import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Field, inputClass } from '../../../components/ui';
import { errorMessage } from '../../../services/http';
import { useAuthActions } from '../hooks/useAuthActions';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuthActions();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) await register({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone || undefined });
      else await login({ email: form.email, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, isRegister ? 'We could not create your account.' : 'We could not sign you in.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {isRegister && (
        <Field label="Full name">
          <input className={inputClass} value={form.fullName} onChange={set('fullName')} autoComplete="name" required minLength={2} />
        </Field>
      )}
      <Field label="Email">
        <input className={inputClass} type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
      </Field>
      {isRegister && (
        <Field label="WhatsApp number (optional)" hint="International format, e.g. +919876543210. Used only for trip alerts.">
          <input className={inputClass} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
        </Field>
      )}
      <Field label="Password" hint={isRegister ? 'At least 10 characters with letters and numbers.' : undefined}>
        <input className={inputClass} type="password" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 10 : 1} />
      </Field>
      {error && <p className="rounded-lg bg-alert-50 px-3 py-2 text-sm text-alert-600" role="alert">{error}</p>}
      <Button type="submit" loading={busy} className="w-full">{isRegister ? 'Create account' : 'Sign in'}</Button>
      <p className="text-center text-sm text-slate-600">
        {isRegister ? 'Already have an account? ' : 'New to Yatre? '}
        <Link className="font-semibold text-ghats-700 underline" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
      </p>
    </form>
  );
}
