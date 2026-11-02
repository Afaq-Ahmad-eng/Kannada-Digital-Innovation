import { motion } from 'framer-motion';
import { useLiveStore } from '../../../store/live';

const MILESTONES = [
  { at: 10, label: 'Checking conditions' },
  { at: 35, label: 'Finding stays and sights' },
  { at: 55, label: 'Drafting days' },
  { at: 90, label: 'Balancing budget' },
];

/** The route line fills as planning stages arrive over the live stream. */
export function GenerationProgress({ tripId }: { tripId: string }) {
  const progress = useLiveStore((s) => s.progress[tripId]);
  const connected = useLiveStore((s) => s.connected);
  const percent = progress?.percent ?? 5;
  return (
    <div className="rounded-2xl border border-sandal-200 bg-white p-6" role="status" aria-live="polite">
      <p className="font-display text-xl font-bold">{progress?.message ?? 'Starting your plan...'}</p>
      <div className="relative mt-8 h-1.5 rounded-full bg-sandal-200">
        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-ghats-600" initial={false} animate={{ width: `${percent}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
        {MILESTONES.map((m) => (
          <span key={m.at} className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${percent >= m.at ? 'border-ghats-600 bg-ghats-600' : 'border-sandal-300 bg-white'}`} style={{ left: `${m.at}%` }} />
        ))}
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {MILESTONES.map((m) => <li key={m.at} className={percent >= m.at ? 'font-semibold text-ghats-700' : 'text-slate-500'}>{m.label}</li>)}
      </ul>
      {!connected && <p className="mt-4 text-xs text-slate-500">Live updates are reconnecting; this page also refreshes on its own.</p>}
    </div>
  );
}
