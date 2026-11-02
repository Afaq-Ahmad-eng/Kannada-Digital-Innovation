import { Loader2, X } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'bg-ghats-600 text-white hover:bg-ghats-700',
  ghost: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
  danger: 'bg-alert-500 text-white hover:bg-alert-600',
};
export function Button({ variant = 'primary', loading, className = '', children, disabled, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button {...rest} disabled={disabled || loading} className={`inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export const inputClass = 'w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-ghats-500';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">{label}</span>{children}</label>;
}

export function Card({ title, action, className = '', children }: { title?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white ${className}`}>
      {(title || action) && <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="font-display text-base font-bold">{title}</h2>{action}</header>}
      <div className="p-4">{children}</div>
    </section>
  );
}

const tones = { neutral: 'bg-slate-100 text-slate-700', good: 'bg-ghats-100 text-ghats-700', warn: 'bg-ochre-100 text-ochre-700', bad: 'bg-alert-50 text-alert-600' } as const;
export type Tone = keyof typeof tones;
export const Badge = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;

export const statusTone = (s: string): Tone => ({ READY: 'good', COMPLETED: 'neutral', PENDING: 'warn', GENERATING: 'warn', DISRUPTED: 'bad', FAILED: 'bad', APPLIED: 'good', PROPOSED: 'warn', UP: 'good', DOWN: 'bad', CRITICAL: 'bad', HIGH: 'warn' } as Record<string, Tone>)[s] ?? 'neutral';

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'bad' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${tone === 'bad' ? 'text-alert-600' : 'text-slate-900'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-slate-500" role="status"><Loader2 className="h-5 w-5 animate-spin" aria-hidden />{label}</div>;
}

export const ErrorNote = ({ message }: { message: string }) => <p className="rounded-lg bg-alert-50 px-3 py-2 text-sm text-alert-600" role="alert">{message}</p>;

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) {
  const rows = Array.isArray(children) ? children.length : children ? 1 : 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-slate-200 text-xs text-slate-500">{head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {rows === 0 && <p className="px-3 py-8 text-center text-sm text-slate-500">{empty ?? 'Nothing to show.'}</p>}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between pt-3 text-sm text-slate-600">
      <span>{total.toLocaleString('en-IN')} total</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <span>Page {page} of {pages}</span>
        <Button variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function Drawer({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </aside>
    </div>
  );
}
