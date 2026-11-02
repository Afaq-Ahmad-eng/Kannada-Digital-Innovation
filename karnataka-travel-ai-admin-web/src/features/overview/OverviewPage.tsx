import { useCallback, useEffect, useState } from 'react';
import { Card, ErrorNote, Spinner, Stat } from '../../components/ui';
import { errorMessage, http } from '../../services/http';
import { formatDay, num, titleCase } from '../../utils/format';

interface Overview {
  totals: { users: number; suspendedUsers: number; newUsers7d: number; trips: number; trips24h: number; disruptions24h: number; disruptionsTotal: number; reroutesOpen: number; reroutesApplied: number };
  tripsByStatus: { status: string; n: number }[];
  planSources: { source: string; n: number }[];
  daily: { day: string; users: number; trips: number }[];
  topDestinations: { name: string; n: number }[];
}

const SOURCE_LABEL: Record<string, string> = { LLM: 'AI generated', CACHE: 'Semantic cache', TEMPLATE: 'Offline template' };

function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-slate-500">No data yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm"><span>{r.label}</span><span className="tabular-nums text-slate-600">{num(r.value)}</span></div>
          <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-ghats-600" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function DailyChart({ data }: { data: Overview['daily'] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.users, d.trips]));
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Sign-ups and trips per day, last 14 days">
        {data.map((d) => (
          <div key={d.day} className="flex h-full flex-1 items-end justify-center gap-0.5" title={`${formatDay(d.day)}: ${d.users} sign-ups, ${d.trips} trips`}>
            <div className="w-1/2 rounded-t bg-ochre-500" style={{ height: `${(d.users / max) * 100}%`, minHeight: d.users ? 2 : 0 }} />
            <div className="w-1/2 rounded-t bg-ghats-600" style={{ height: `${(d.trips / max) * 100}%`, minHeight: d.trips ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{formatDay(data[0].day)}</span><span>{formatDay(data[data.length - 1].day)}</span></div>
      <p className="mt-2 flex gap-4 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-ochre-500" />Sign-ups</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-ghats-600" />Trips planned</span></p>
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setData((await http.get<Overview>('/admin/overview')).data); setError(null); } catch (e) { setError(errorMessage(e)); }
  }, []);
  useEffect(() => {
    void load();
    const i = setInterval(() => void load(), 30_000);
    return () => clearInterval(i);
  }, [load]);

  if (!data) return error ? <ErrorNote message={error} /> : <Spinner />;
  const t = data.totals;
  const failed = data.tripsByStatus.find((s) => s.status === 'FAILED')?.n ?? 0;

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Overview</h1><p className="text-sm text-slate-500">Live read model built from platform events. Refreshes every 30 seconds.</p></div>
      {error && <ErrorNote message={error} />}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Travellers" value={num(t.users)} hint={`${num(t.newUsers7d)} new in 7 days`} />
        <Stat label="Suspended accounts" value={num(t.suspendedUsers)} tone={t.suspendedUsers ? 'bad' : undefined} />
        <Stat label="Trips planned" value={num(t.trips)} hint={`${num(t.trips24h)} in the last 24 h`} />
        <Stat label="Failed plans" value={num(failed)} tone={failed ? 'bad' : undefined} hint={t.trips ? `${Math.round((failed / t.trips) * 100)}% of all trips` : undefined} />
        <Stat label="Disruptions (24 h)" value={num(t.disruptions24h)} hint={`${num(t.disruptionsTotal)} all time`} tone={t.disruptions24h ? 'bad' : undefined} />
        <Stat label="Open reroute proposals" value={num(t.reroutesOpen)} />
        <Stat label="Reroutes accepted" value={num(t.reroutesApplied)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Last 14 days"><DailyChart data={data.daily} /></Card>
        <Card title="Trips by status"><BarList rows={data.tripsByStatus.map((s) => ({ label: titleCase(s.status), value: s.n }))} /></Card>
        <Card title="How plans were produced"><BarList rows={data.planSources.map((s) => ({ label: SOURCE_LABEL[s.source] ?? s.source, value: s.n }))} /></Card>
        <Card title="Most planned destinations"><BarList rows={data.topDestinations.map((d) => ({ label: d.name, value: d.n }))} /></Card>
      </div>
    </div>
  );
}
