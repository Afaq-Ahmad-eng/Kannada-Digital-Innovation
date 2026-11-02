import { ExternalLink, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, ErrorNote, Spinner, statusTone } from '../../components/ui';
import { errorMessage } from '../../services/http';
import { operationsApi, ServiceHealth } from './operationsApi';

const LINKS = [
  { label: 'Grafana', url: import.meta.env.VITE_GRAFANA_URL as string | undefined },
  { label: 'Jaeger traces', url: import.meta.env.VITE_JAEGER_URL as string | undefined },
  { label: 'Prometheus', url: import.meta.env.VITE_PROMETHEUS_URL as string | undefined },
].filter((l) => l.url);

export default function OperationsPage() {
  const [services, setServices] = useState<ServiceHealth[] | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [scan, setScan] = useState<{ busy: boolean; result?: string; error?: string }>({ busy: false });

  const loadHealth = useCallback(async () => {
    setRefreshing(true);
    try { setServices(await operationsApi.health()); setHealthError(null); } catch (e) { setHealthError(errorMessage(e)); } finally { setRefreshing(false); }
  }, []);
  useEffect(() => {
    void loadHealth();
    const i = setInterval(() => void loadHealth(), 20_000);
    return () => clearInterval(i);
  }, [loadHealth]);

  async function runScan() {
    setScan({ busy: true });
    try {
      const r = await operationsApi.scan();
      setScan({ busy: false, result: `Checked ${r.trips} active trip(s) across ${r.regions} region(s); ${r.disruptions} new disruption(s) raised.` });
    } catch (e) { setScan({ busy: false, error: errorMessage(e) }); }
  }

  const down = services?.filter((s) => s.status === 'DOWN').length ?? 0;
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Operations</h1><p className="text-sm text-slate-500">Platform health and manual controls. Every action is written to the audit log.</p></div>

      <Card title="Service health" action={<Button variant="ghost" onClick={() => void loadHealth()} loading={refreshing}><RefreshCw className="h-4 w-4" aria-hidden />Refresh</Button>}>
        {healthError && <ErrorNote message={healthError} />}
        {!services && !healthError && <Spinner />}
        {services && (
          <>
            <p className={`mb-3 text-sm font-semibold ${down ? 'text-alert-600' : 'text-ghats-700'}`}>{down ? `${down} of ${services.length} components are down` : 'All components are responding'}</p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <li key={s.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                  <span><span className="block font-semibold">{s.name}</span><span className="text-xs text-slate-500">{s.latencyMs != null ? `${s.latencyMs} ms` : 'no response'}</span></span>
                  <Badge tone={statusTone(s.status)}>{s.status}</Badge>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card title="Disruption scan">
        <p className="text-sm text-slate-600">Runs the alert service's scan now instead of waiting for the schedule. It checks every active trip's regions (AI with live web search when configured) and notifies affected travellers.</p>
        {scan.error && <div className="mt-3"><ErrorNote message={scan.error} /></div>}
        {scan.result && <p className="mt-3 text-sm font-semibold text-ghats-700" role="status">{scan.result}</p>}
        <Button className="mt-3" loading={scan.busy} onClick={() => void runScan()}>Run scan now</Button>
      </Card>

      {LINKS.length > 0 && (
        <Card title="Observability">
          <div className="flex flex-wrap gap-2">
            {LINKS.map((l) => <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold hover:bg-slate-100">{l.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>)}
          </div>
        </Card>
      )}
    </div>
  );
}
