import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { formatDate, formatINR } from '../../../utils/format';
import type { Day } from '../types';
import { ActivityCard } from './ActivityCard';

interface Props {
  days: Day[];
  activeDay: number;
  onActiveChange: (d: number) => void;
  editable: boolean;
  onReorder: (dayNumber: number, orderedIds: string[]) => void;
}

export function DayAccordion({ days, activeDay, onActiveChange, editable, onReorder }: Props) {
  return (
    <ol className="space-y-3">
      {days.map((day) => {
        const open = day.dayNumber === activeDay;
        const cost = day.activities.reduce((s, a) => s + a.estCostInr, 0);
        return (
          <li key={day.dayNumber} className="overflow-hidden rounded-2xl border border-sandal-200 bg-white">
            <button type="button" aria-expanded={open} onClick={() => onActiveChange(day.dayNumber)} className="flex w-full items-center gap-3 p-4 text-left">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-lg font-bold ${open ? 'bg-ochre-600 text-white' : 'bg-sandal-100 text-slate-700'}`}>{day.dayNumber}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-lg font-bold">{day.theme || `Day ${day.dayNumber}`}</span>
                <span className="block text-sm text-slate-600">{formatDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatINR(cost)}</span>
              </span>
              <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="space-y-3 px-4 pb-4">
                    {day.summary && <p className="text-sm text-slate-600">{day.summary}</p>}
                    <ul className="space-y-2">
                      {day.activities.map((a, i) => (
                        <ActivityCard
                          key={a.id}
                          activity={a}
                          index={i}
                          count={day.activities.length}
                          editable={editable}
                          onMove={(dir) => {
                            const ids = day.activities.map((x) => x.id);
                            [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
                            onReorder(day.dayNumber, ids);
                          }}
                        />
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}
