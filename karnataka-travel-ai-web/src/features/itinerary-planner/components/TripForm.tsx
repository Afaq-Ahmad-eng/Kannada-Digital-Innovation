import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Field, inputClass } from '../../../components/ui';
import { errorMessage } from '../../../services/http';
import { isoDate, titleCase } from '../../../utils/format';
import { CLUSTERS, Cluster, DESTINATIONS, ORIGINS } from '../../../utils/karnataka';
import { itineraryApi } from '../services/itineraryApi';
import type { BudgetTier, Dietary, GenerateRequest, TravelPace } from '../types';

export interface TripFormDefaults { budgetTier?: BudgetTier; pace?: TravelPace; dietary?: Dietary; accessibility?: string[]; origin?: string }

const TIERS: { id: BudgetTier; label: string; hint: string }[] = [
  { id: 'BACKPACKER', label: 'Backpacker', hint: 'Buses, dorms, local eateries' },
  { id: 'MODERATE', label: 'Moderate', hint: 'Hotels, trains and cabs' },
  { id: 'LUXURY', label: 'Luxury', hint: 'Heritage stays, private cars' },
];
const DIETS: Dietary[] = ['NONE', 'VEGETARIAN', 'SATTVIC', 'JAIN', 'HALAL', 'COASTAL_VEGETARIAN', 'NON_VEGETARIAN'];

export function TripForm({ defaults }: { defaults?: TripFormDefaults }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<GenerateRequest>({
    origin: defaults?.origin && ORIGINS.includes(defaults.origin) ? defaults.origin : 'Bengaluru',
    clusters: ['HERITAGE'],
    destinations: [],
    startDate: isoDate(7),
    endDate: isoDate(10),
    budgetTier: defaults?.budgetTier ?? 'MODERATE',
    travelers: 2,
    pace: defaults?.pace ?? 'BALANCED',
    dietary: defaults?.dietary ?? 'NONE',
    accessibility: defaults?.accessibility ?? [],
    interests: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<GenerateRequest>) => setForm((f) => ({ ...f, ...p }));

  const toggleCluster = (c: Cluster) => {
    const next = form.clusters.includes(c) ? form.clusters.filter((x) => x !== c) : [...form.clusters, c];
    if (next.length === 0) return;
    patch({ clusters: next, destinations: form.destinations.filter((d) => DESTINATIONS.find((x) => x.name === d && x.cluster && next.includes(x.cluster))) });
  };
  const toggleDest = (name: string) => patch({ destinations: form.destinations.includes(name) ? form.destinations.filter((d) => d !== name) : [...form.destinations, name] });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { tripId } = await itineraryApi.generate({ ...form, interests: form.interests?.trim() || undefined });
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(errorMessage(err, 'We could not start planning your trip.'));
      setBusy(false);
    }
  }

  const available = DESTINATIONS.filter((d) => d.cluster && form.clusters.includes(d.cluster));

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starting from">
          <select className={inputClass} value={form.origin} onChange={(e) => patch({ origin: e.target.value })}>{ORIGINS.map((o) => <option key={o}>{o}</option>)}</select>
        </Field>
        <Field label="Travellers">
          <input className={inputClass} type="number" min={1} max={12} value={form.travelers} onChange={(e) => patch({ travelers: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })} />
        </Field>
        <Field label="Start date"><input className={inputClass} type="date" min={isoDate(0)} value={form.startDate} onChange={(e) => patch({ startDate: e.target.value, endDate: e.target.value > form.endDate ? e.target.value : form.endDate })} required /></Field>
        <Field label="End date" hint="Up to 14 days"><input className={inputClass} type="date" min={form.startDate} value={form.endDate} onChange={(e) => patch({ endDate: e.target.value })} required /></Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">What kind of trip?</legend>
        <div className="flex flex-wrap gap-2">
          {CLUSTERS.map((c) => <Chip key={c.id} selected={form.clusters.includes(c.id)} onClick={() => toggleCluster(c.id)}>{c.label}</Chip>)}
        </div>
        <p className="mt-2 text-xs text-slate-500">{CLUSTERS.filter((c) => form.clusters.includes(c.id)).map((c) => c.hint).join(' · ')}</p>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Pick places (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {available.map((d) => <Chip key={d.name} selected={form.destinations.includes(d.name)} onClick={() => toggleDest(d.name)}>{d.name}</Chip>)}
        </div>
        <p className="mt-2 text-xs text-slate-500">Leave empty and we will choose the best fit for your dates.</p>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Budget</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {TIERS.map((t) => (
            <button key={t.id} type="button" aria-pressed={form.budgetTier === t.id} onClick={() => patch({ budgetTier: t.id })}
              className={`rounded-xl border p-3 text-left transition-colors ${form.budgetTier === t.id ? 'border-ochre-600 bg-ochre-50' : 'border-sandal-300 bg-white hover:bg-sandal-100'}`}>
              <span className="block font-display text-base font-bold">{t.label}</span>
              <span className="text-xs text-slate-600">{t.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pace">
          <select className={inputClass} value={form.pace} onChange={(e) => patch({ pace: e.target.value as TravelPace })}>
            <option value="RELAXED">Relaxed - 2 stops a day</option><option value="BALANCED">Balanced - 3 stops a day</option><option value="FAST">Fast - 4 or more stops</option>
          </select>
        </Field>
        <Field label="Food">
          <select className={inputClass} value={form.dietary} onChange={(e) => patch({ dietary: e.target.value as Dietary })}>{DIETS.map((d) => <option key={d} value={d}>{d === 'NONE' ? 'No restrictions' : titleCase(d)}</option>)}</select>
        </Field>
      </div>
      <Field label="Anything else we should know?" hint="For example: sunrise treks, photography, travelling with grandparents">
        <textarea className={inputClass} rows={2} maxLength={300} value={form.interests} onChange={(e) => patch({ interests: e.target.value })} />
      </Field>

      {error && <p className="rounded-lg bg-alert-50 px-3 py-2 text-sm text-alert-600" role="alert">{error}</p>}
      <Button type="submit" loading={busy} className="w-full sm:w-auto">Plan my trip</Button>
    </form>
  );
}
