import { ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ErrorNote, Field, inputClass } from '../../components/ui';
import { errorMessage } from '../../services/http';
import { useAuthStore } from '../../store/auth';
import { authApi } from './authApi';

export default function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const s = await authApi.login(email, password);
      setSession(s.accessToken, s.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Sign-in failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-ochre-600" aria-hidden /><h1 className="font-display text-2xl font-bold">Yatre Admin</h1></div>
        <p className="text-sm text-slate-600">Administrator accounts only. Traveller accounts cannot sign in here.</p>
        <Field label="Email"><input className={inputClass} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
        <Field label="Password"><input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
        {error && <ErrorNote message={error} />}
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
    </div>
  );
}
