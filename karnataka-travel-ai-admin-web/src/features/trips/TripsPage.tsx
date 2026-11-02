import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge, Card, Drawer, ErrorNote, inputClass, Pagination, Spinner, statusTone, Table } from '../../components/ui';
import { usePaged } from '../../hooks/usePaged';
import { errorMessage } from '../../services/http';
import { formatDateTime, titleCase } from '../../utils/format';
import { tripsApi, TripDetail } from './tripsApi';

const STATUSES = ['PENDING', 'GENERATING', 'READY', 'DISRUPTED', 'FAILED', 'COMPLETED'];
const SOURCE: Record<string, string> = { LLM: 'AI', CACHE: 'Cache', TEMPLATE: 'Template' };

function TripPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [d, setD] = useState<TripDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setD(null); setError(null);
    if (id) tripsApi.get(id).then(setD).catch((e) => setError(errorMessage(e)));
  }, [id]);
  const t = d?.trip;
  return (
    <Drawer open={!!id} title="Trip details" onClose={onClose}>
      {error && <ErrorNote message={error} />}
      {!d && !error && <Spinner />}
      {t && d && (
        <div className="space-y-5 text-sm">
          <dl className="grid grid-cols-[110px_1fr] gap-y-1.5">
            <dt className="text-slate-500">Traveller</dt><dd className="break-all">{t.userEmail ?? t.userId}</dd>
            <dt className="text-slate-500">Route</dt><dd>{t.origin} to {t.destinations.join(', ') || '-'}</dd>
            <dt className="text-slate-500">Dates</dt><dd>{t.startDate} to {t.endDate}</dd>
            <dt className="text-slate-500">Budget</dt><dd>{titleCase(t.budgetTier ?? '-')} · {t.travelers} traveller(s)</dd>
            <dt className="text-slate-500">Status</dt><dd><Badge tone={statusTone(t.status)}>{titleCase(t.status)}</Badge> {t.source && <span className="ml-2 text-slate-500">{SOURCE[t.source] ?? t.source}</span>}</dd>
            {t.failureReason && <><dt className="text-slate-500">Failure</dt><dd className="text-alert-600">{t.failureReason}</dd></>}
            <dt className="text-slate-500">Created</dt><dd>{formatDateTime(t.createdAt)}</dd>
            <dt className="text-slate-500">Trip ID</dt><dd className="break-all text-xs text-slate-500">{t.id}</dd>
          </dl>
          <div>
            <h3 className="mb-2 font-display text-base font-bold">Disruptions ({d.disruptions.length})</h3>
            {d.disruptions.length === 0 ? <p className="text-slate-500">None.</p> : <ul className="space-y-2">{d.disruptions.map((x, i) => <li key={i} className="rounded-lg bg-slate-50 p-2.5"><Badge tone={statusTone(x.severity)}>{x.severity}</Badge> <span className="font-semibold">{x.headline}</span><span className="block text-xs text-slate-500">{x.region} · {formatDateTime(x.detectedAt)}</span></li>)}</ul>}
          </div>
          <div>
            <h3 className="mb-2 font-display text-base font-bold">Reroute proposals ({d.reroutes.length})</h3>
            {d.reroutes.length === 0 ? <p className="text-slate-500">None.</p> : <ul className="space-y-2">{d.reroutes.map((x) => <li key={x.proposalId} className="rounded-lg bg-slate-50 p-2.5"><Badge tone={statusTone(x.status)}>{titleCase(x.status)}</Badge><span className="mt-1 block">{x.summary}</span><span className="block text-xs text-slate-500">{formatDateTime(x.createdAt)}</span></li>)}</ul>}
          </div>
          <p className="text-xs text-slate-500">Itinerary contents stay private to the traveller; admins see operational metadata only.</p>
        </div>
      )}
    </Drawer>
  );
}

export default function TripsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(t); }, [search]);
  const { data, page, setPage, error, loading } = usePaged((p) => tripsApi.list(p, status, debounced), [status, debounced]);

  return (
    <div className="space-y-4">
      <div><h1 className="font-display text-3xl font-bold">Trips</h1><p className="text-sm text-slate-500">Every planned trip with its lifecycle status.</p></div>
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input className={`${inputClass} pl-9`} placeholder="Search by traveller email or origin" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search trips" />
          </div>
          <select className={`${inputClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </div>
        {error && <ErrorNote message={error} />}
        {!data && loading ? <Spinner /> : data && (
          <>
            <Table head={['Traveller', 'Route', 'Dates', 'Plan', 'Status']} empty="No trips match.">
              {data.items.map((t) => (
                <tr key={t.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelected(t.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelected(t.id)}>
                  <td className="px-3 py-2.5 text-xs">{t.userEmail ?? t.userId.slice(0, 8)}</td>
                  <td className="px-3 py-2.5">{t.origin ?? '-'} to {t.destinations.join(', ') || '-'}</td>
                  <td className="px-3 py-2.5 text-slate-600">{t.startDate} - {t.endDate}</td>
                  <td className="px-3 py-2.5 text-slate-600">{t.source ? SOURCE[t.source] ?? t.source : '-'}</td>
                  <td className="px-3 py-2.5"><Badge tone={statusTone(t.status)}>{titleCase(t.status)}</Badge></td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
      <TripPanel id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
