import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui';
import { formatDate, titleCase } from '../../../utils/format';
import type { TripStatus, TripSummary } from '../types';

const tone: Record<TripStatus, 'neutral' | 'good' | 'warn' | 'bad'> = { PENDING: 'warn', GENERATING: 'warn', READY: 'good', DISRUPTED: 'bad', FAILED: 'bad', COMPLETED: 'neutral' };

export function TripList({ trips }: { trips: TripSummary[] }) {
  if (trips.length === 0) return <p className="text-sm text-slate-600">No trips yet. Plan your first one above.</p>;
  return (
    <ul className="divide-y divide-sandal-200">
      {trips.map((t) => (
        <li key={t.id}>
          <Link to={`/trips/${t.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-sandal-50">
            <span className="min-w-0">
              <span className="block truncate font-display font-bold">{t.title ?? `Trip from ${t.origin}`}</span>
              <span className="text-sm text-slate-600">{formatDate(t.startDate)} to {formatDate(t.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </span>
            <Badge tone={tone[t.status]}>{titleCase(t.status)}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
