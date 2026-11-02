import { CloudRain } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, Spinner } from '../components/ui';
import { BudgetSummary } from '../features/itinerary-planner/components/BudgetSummary';
import { DayAccordion } from '../features/itinerary-planner/components/DayAccordion';
import { GenerationProgress } from '../features/itinerary-planner/components/GenerationProgress';
import { TripMap } from '../features/itinerary-planner/components/TripMap';
import { useTrip } from '../features/itinerary-planner/hooks/useTrip';
import { alertsApi } from '../features/travel-alerts/services/alertsApi';
import { errorMessage } from '../services/http';
import { useLiveStore } from '../store/live';
import { formatDate, titleCase } from '../utils/format';

const DEMO = import.meta.env.VITE_ENABLE_DEMO === 'true';

export default function TripPage() {
  const { id = '' } = useParams();
  const { trip, error, reorder } = useTrip(id);
  const allAdvisories = useLiveStore((s) => s.advisories);
  const advisories = allAdvisories.filter((a) => a.tripId === id);
  const [activeDay, setActiveDay] = useState(1);
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    if (trip && activeDay !== -1 && !trip.days.some((d) => d.dayNumber === activeDay)) setActiveDay(trip.days[0]?.dayNumber ?? 1);
  }, [trip, activeDay]);

  if (error && !trip) return <Card><p className="text-alert-600" role="alert">{error}</p><Link className="mt-3 inline-block font-semibold text-ghats-700 underline" to="/">Back to your trips</Link></Card>;
  if (!trip) return <Spinner label="Loading trip" />;

  const generating = trip.status === 'PENDING' || trip.status === 'GENERATING';
  const editable = trip.status === 'READY' || trip.status === 'DISRUPTED';

  async function simulate() {
    if (!trip) return;
    const region = trip.days.flatMap((d) => d.activities).find((a) => a.category !== 'TRANSIT' && a.category !== 'STAY')?.destination ?? trip.destinations[0];
    if (!region) return;
    setSimBusy(true);
    setSimError(null);
    try {
      await alertsApi.simulate(trip.id, region, `Heavy rainfall warning in ${region}`);
    } catch (e) {
      setSimError(errorMessage(e, 'Could not simulate a disruption.'));
    } finally {
      setSimBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <Link to="/" className="text-sm font-semibold text-ghats-700 underline">All trips</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{trip.title ?? 'Planning your trip'}</h1>
            <p className="mt-1 text-slate-600">From {trip.origin} · {formatDate(trip.startDate)} to {formatDate(trip.endDate, { day: 'numeric', month: 'short', year: 'numeric' })} · {trip.travelers} traveller{trip.travelers > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={trip.status === 'READY' ? 'good' : trip.status === 'DISRUPTED' || trip.status === 'FAILED' ? 'bad' : 'warn'}>{titleCase(trip.status)}</Badge>
            {DEMO && editable && <Button variant="ghost" loading={simBusy} onClick={simulate}><CloudRain className="h-4 w-4" aria-hidden />Simulate rain alert</Button>}
          </div>
        </div>
        {simError && <p className="mt-2 text-sm text-alert-600" role="alert">{simError}</p>}
        {error && <p className="mt-2 text-sm text-alert-600" role="alert">{error}</p>}
        {trip.summary && !generating && <p className="mt-3 max-w-3xl text-slate-700">{trip.summary}</p>}
        {trip.source === 'TEMPLATE' && <p className="mt-2 text-sm text-slate-500">This is an offline starter plan with estimated costs. Connect an AI key on the server for a fully personalised itinerary.</p>}
        {trip.source === 'CACHE' && <p className="mt-2 text-sm text-slate-500">Built from a verified plan for a very similar trip.</p>}
      </header>

      {generating && <GenerationProgress tripId={trip.id} />}
      {trip.status === 'FAILED' && (
        <Card><p className="font-semibold text-alert-600" role="alert">{trip.failureReason ?? 'We could not plan this trip.'}</p><Link className="mt-2 inline-block font-semibold text-ghats-700 underline" to="/">Try again with different dates or places</Link></Card>
      )}

      {trip.days.length > 0 && (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
          <DayAccordion days={trip.days} activeDay={activeDay} onActiveChange={(d) => setActiveDay(d === activeDay ? -1 : d)} editable={editable} onReorder={reorder} />
          <aside className="space-y-4 lg:sticky lg:top-20">
            <div className="overflow-hidden rounded-2xl border border-sandal-200">
              <TripMap days={trip.days} activeDay={activeDay} alerts={advisories.map((a) => ({ id: a.id, region: a.region, headline: a.headline }))} />
            </div>
            {trip.budget && <BudgetSummary budget={trip.budget} travelers={trip.travelers} />}
            {trip.tips.length > 0 && (
              <Card>
                <h3 className="font-display text-lg font-bold">Before you go</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">{trip.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </Card>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
