import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Car, Clock, Mountain, Wallet } from 'lucide-react';
import { Badge } from '../../../components/ui';
import { formatDuration, formatINR, titleCase } from '../../../utils/format';
import type { Activity } from '../types';

interface Props { activity: Activity; index: number; count: number; editable: boolean; onMove: (dir: -1 | 1) => void }

export function ActivityCard({ activity: a, index, count, editable, onMove }: Props) {
  return (
    <motion.li layout transition={{ type: 'spring', stiffness: 400, damping: 36 }} className="rounded-xl border border-sandal-200 bg-sandal-50 p-3">
      <div className="flex items-start gap-3">
        <div className="w-14 shrink-0 text-sm font-semibold tabular-nums text-ochre-700">{a.startTime}</div>
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-base font-bold leading-snug">{a.title}</h4>
          {a.description && <p className="mt-0.5 text-sm text-slate-600">{a.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{formatDuration(a.durationMin)}</span>
            <span className="inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" aria-hidden />{a.estCostInr ? formatINR(a.estCostInr) : 'Free'}</span>
            <Badge tone={a.indoor ? 'good' : 'neutral'}>{a.indoor ? 'Indoor' : 'Outdoor'}</Badge>
            <Badge>{titleCase(a.category)}</Badge>
          </div>
        </div>
        {editable && (
          <div className="flex shrink-0 flex-col">
            <button type="button" aria-label={`Move ${a.title} earlier`} disabled={index === 0} onClick={() => onMove(-1)} className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-sandal-200 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" aria-label={`Move ${a.title} later`} disabled={index === count - 1} onClick={() => onMove(1)} className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-sandal-200 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      {a.legDistanceKm != null && a.legDurationMin != null && index < count - 1 && (
        <p className="ml-[68px] mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <Car className="h-3.5 w-3.5" aria-hidden />
          Next stop: {Math.round(a.legDistanceKm)} km, about {formatDuration(a.legDurationMin)}
          {a.ghat && <span className="inline-flex items-center gap-1 font-medium text-ochre-700"><Mountain className="h-3.5 w-3.5" aria-hidden />ghat road</span>}
        </p>
      )}
    </motion.li>
  );
}
