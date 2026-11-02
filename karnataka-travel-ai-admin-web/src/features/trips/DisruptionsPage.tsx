import { Badge, Card, ErrorNote, Pagination, Spinner, statusTone, Table } from '../../components/ui';
import { usePaged } from '../../hooks/usePaged';
import { formatDateTime, titleCase } from '../../utils/format';
import { tripsApi } from './tripsApi';

export default function DisruptionsPage() {
  const { data, page, setPage, error, loading } = usePaged((p) => tripsApi.disruptions(p), []);
  return (
    <div className="space-y-4">
      <div><h1 className="font-display text-3xl font-bold">Disruptions</h1><p className="text-sm text-slate-500">Weather, road and bandh events detected on active trips.</p></div>
      <Card>
        {error && <ErrorNote message={error} />}
        {!data && loading ? <Spinner /> : data && (
          <>
            <Table head={['When', 'Region', 'Alert', 'Severity', 'Traveller']} empty="No disruptions recorded.">
              {data.items.map((d) => (
                <tr key={d.id}>
                  <td className="px-3 py-2.5 text-slate-600">{formatDateTime(d.detectedAt)}</td>
                  <td className="px-3 py-2.5">{d.region}</td>
                  <td className="px-3 py-2.5"><span className="font-semibold">{d.headline}</span>{d.category && <span className="block text-xs text-slate-500">{titleCase(d.category)}</span>}</td>
                  <td className="px-3 py-2.5"><Badge tone={statusTone(d.severity)}>{titleCase(d.severity)}</Badge></td>
                  <td className="px-3 py-2.5 text-xs">{d.userEmail ?? '-'}</td>
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
