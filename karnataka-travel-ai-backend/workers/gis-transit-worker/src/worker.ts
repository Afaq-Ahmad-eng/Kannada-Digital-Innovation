import { Topics } from '@kta/kafka-events';
import { jobsProcessed } from '@kta/service-kit';
import type { Day } from '@kta/shared-types';
import { computeLeg } from './router';
import { bus, log } from './shared';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Leg i = travel from activity i to activity i+1 within the same day. */
async function legsFor(days: Day[]) {
  const legs: { dayNumber: number; position: number; distanceKm: number; durationMin: number; ghat: boolean }[] = [];
  for (const d of days) {
    for (let i = 0; i < d.activities.length - 1; i++) {
      const a = d.activities[i];
      const b = d.activities[i + 1];
      if (a.lat === b.lat && a.lng === b.lng) continue;
      const leg = await computeLeg(a, b);
      legs.push({ dayNumber: d.dayNumber, position: i, distanceKm: leg.distanceKm, durationMin: leg.durationMin, ghat: leg.ghat });
      await sleep(120); // be polite to shared OSRM instances
    }
  }
  return legs;
}

export async function startWorker(): Promise<void> {
  await bus.subscribe('gis-transit-worker', {
    [Topics.ItineraryGenerated]: async (p) => {
      await sleep(1500); // let the itinerary service persist the plan first
      const legs = await legsFor(p.plan.days);
      await bus.publish(Topics.RouteLegsComputed, { tripId: p.tripId, userId: p.userId, legs }, p.tripId);
      jobsProcessed.inc({ worker: 'gis-transit', outcome: 'ok' });
      log.info({ tripId: p.tripId, legs: legs.length }, 'route legs computed');
    },
    [Topics.ItineraryRerouted]: async (p) => {
      await sleep(1500);
      const legs = await legsFor(p.changedDays);
      await bus.publish(Topics.RouteLegsComputed, { tripId: p.tripId, userId: p.userId, legs }, p.tripId);
      jobsProcessed.inc({ worker: 'gis-transit', outcome: 'ok' });
    },
  });
}
