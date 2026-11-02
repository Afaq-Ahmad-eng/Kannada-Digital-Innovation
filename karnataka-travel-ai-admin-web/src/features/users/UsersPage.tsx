import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge, Card, ErrorNote, inputClass, Pagination, Spinner, Table } from '../../components/ui';
import { usePaged } from '../../hooks/usePaged';
import { formatDateTime } from '../../utils/format';
import { usersApi } from './usersApi';
import { UserPanel } from './UserPanel';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(t); }, [search]);

  const { data, page, setPage, error, loading, reload } = usePaged((p) => usersApi.list(p, debounced, status), [debounced, status]);

  return (
    <div className="space-y-4">
      <div><h1 className="font-display text-3xl font-bold">Travellers</h1><p className="text-sm text-slate-500">Search accounts, suspend or reactivate them and send notifications.</p></div>
      <Card>
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input className={`${inputClass} pl-9`} placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search travellers" />
          </div>
          <select className={`${inputClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All accounts</option><option value="active">Active</option><option value="suspended">Suspended</option>
          </select>
        </div>
        {error && <ErrorNote message={error} />}
        {!data && loading ? <Spinner /> : data && (
          <>
            <Table head={['Traveller', 'Trips', 'Registered', 'Status']} empty="No travellers match.">
              {data.items.map((u) => (
                <tr key={u.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelected(u.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelected(u.id)}>
                  <td className="px-3 py-2.5"><span className="block font-semibold">{u.fullName ?? '-'}</span><span className="text-xs text-slate-500">{u.email}</span></td>
                  <td className="px-3 py-2.5 tabular-nums">{u.tripCount}</td>
                  <td className="px-3 py-2.5 text-slate-600">{formatDateTime(u.registeredAt)}</td>
                  <td className="px-3 py-2.5"><Badge tone={u.disabled ? 'bad' : 'good'}>{u.disabled ? 'Suspended' : 'Active'}</Badge></td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
      <UserPanel userId={selected} onClose={() => setSelected(null)} onChanged={() => void reload()} />
    </div>
  );
}
