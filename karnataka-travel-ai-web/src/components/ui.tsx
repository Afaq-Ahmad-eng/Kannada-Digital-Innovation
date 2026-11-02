import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-ochre-600 text-white hover:bg-ochre-700 disabled:bg-ochre-300',
  secondary: 'bg-ghats-600 text-white hover:bg-ghats-700 disabled:bg-ghats-300',
  ghost: 'bg-transparent text-slate-700 hover:bg-sandal-100 border border-sandal-300',
  danger: 'bg-alert-500 text-white hover:bg-alert-600 disabled:opacity-60',
};

export function Button({ variant = 'primary', loading, className = '', children, disabled, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export const inputClass =
  'w-full min-h-[44px] rounded-lg border border-sandal-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-ghats-500';

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-800">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-alert-500" role="alert">{error}</span>}
    </label>
  );
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-2xl border border-sandal-200 bg-white p-4 sm:p-6 ${className}`}>{children}</section>;
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

const badgeTone = { neutral: 'bg-sandal-100 text-slate-700', good: 'bg-ghats-100 text-ghats-800', warn: 'bg-ochre-100 text-ochre-800', bad: 'bg-alert-50 text-alert-600' } as const;
export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof badgeTone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTone[tone]}`}>{children}</span>;
}

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-[40px] rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${selected ? 'border-ghats-600 bg-ghats-600 text-white' : 'border-sandal-300 bg-white text-slate-700 hover:bg-sandal-100'}`}
    >
      {children}
    </button>
  );
}
