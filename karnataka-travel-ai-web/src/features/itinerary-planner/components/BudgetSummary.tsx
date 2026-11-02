import { Card } from '../../../components/ui';
import { formatINR } from '../../../utils/format';
import type { Budget } from '../types';

const ROWS: { key: keyof Omit<Budget, 'total'>; label: string; bar: string }[] = [
  { key: 'accommodation', label: 'Stay', bar: 'bg-ghats-600' },
  { key: 'food', label: 'Food', bar: 'bg-ochre-500' },
  { key: 'transport', label: 'Getting around', bar: 'bg-slate-600' },
  { key: 'activities', label: 'Experiences', bar: 'bg-ochre-800' },
];

export function BudgetSummary({ budget, travelers }: { budget: Budget; travelers: number }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold">Estimated budget</h3>
        <p className="font-display text-xl font-bold text-ochre-700">{formatINR(budget.total)}</p>
      </div>
      <p className="text-xs text-slate-500">For {travelers} traveller{travelers > 1 ? 's' : ''} · about {formatINR(budget.total / travelers)} each. Estimates, not quotes.</p>
      <ul className="mt-4 space-y-3">
        {ROWS.map((r) => {
          const pct = budget.total ? Math.round((budget[r.key] / budget.total) * 100) : 0;
          return (
            <li key={r.key}>
              <div className="flex justify-between text-sm"><span>{r.label}</span><span className="tabular-nums">{formatINR(budget[r.key])}</span></div>
              <div className="mt-1 h-2 rounded-full bg-sandal-100" role="img" aria-label={`${r.label} ${pct}% of budget`}><div className={`h-2 rounded-full ${r.bar}`} style={{ width: `${pct}%` }} /></div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
