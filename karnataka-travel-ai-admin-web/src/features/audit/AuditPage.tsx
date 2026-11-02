import { useState } from 'react';
import { Card, ErrorNote, inputClass, Pagination, Spinner, Table } from '../../components/ui';
import { usePaged, Page } from '../../hooks/usePaged';
import { http } from '../../services/http';
import { formatDateTime, titleCase } from '../../utils/format';

interface Entry { id: number; actorEmail: string | null; action: string; targetType: string | null; targetId: string | null; detail: Record<string, unknown>; createdAt: string }
const ACTIONS = ['USER_SUSPENDED', 'USER_REACTIVATED', 'NOTIFICATION_SENT', 'ALERT_SCAN_TRIGGERED'];

export default function AuditPage() {
  const [action, setAction] = useState('');
  const { data, page, setPage, error, loading } = usePaged(
    (p) => http.get<Page<Entry>>('/admin/audit', { params: { page: p, action: action || undefined } }).then((r) => r.data),
    [action],
  );
  return (
    <div className="space-y-4">
      <div><h1 className="font-display text-3xl font-bold">Audit log</h1><p className="text-sm text-slate-500">Who did what. Entries cannot be edited from this app.</p></div>
      <Card>
        <select className={`${inputClass} mb-3 w-auto`} value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action">
          <option value="">All actions</option>{ACTIONS.map((a) => <option key={a} value={a}>{titleCase(a)}</option>)}
        </select>
        {error && <ErrorNote message={error} />}
        {!data && loading ? <Spinner /> : data && (
          <>
            <Table head={['When', 'Admin', 'Action', 'Target', 'Details']} empty="No actions recorded yet.">
              {data.items.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{formatDateTime(e.createdAt)}</td>
                  <td className="px-3 py-2.5 text-xs">{e.actorEmail ?? '-'}</td>
                  <td className="px-3 py-2.5 font-semibold">{titleCase(e.action)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{e.targetType ? `${e.targetType} ${e.targetId ?? ''}`.slice(0, 48) : '-'}</td>
                  <td className="max-w-[260px] truncate px-3 py-2.5 text-xs text-slate-600" title={JSON.stringify(e.detail)}>{Object.keys(e.detail).length ? JSON.stringify(e.detail) : '-'}</td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
