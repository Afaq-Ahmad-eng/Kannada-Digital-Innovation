import { badRequest, withTransaction } from '@kta/service-kit';
import type { PoolClient } from '@kta/service-kit';
import { Activity, addDays, Day, Plan, TripParams, TripStatus } from '@kta/shared-types';
import { pool } from '../../database';

export type ItemDTO = Activity & { id: string };
export interface DayDTO {
  dayNumber: number;
  date: string;
  theme: string;
  summary: string;
  activities: ItemDTO[];
}
export interface TripSummary {
  id: string;
  title: string | null;
  origin: string;
  clusters: string[];
  destinations: string[];
  startDate: string;
  endDate: string;
  budgetTier: string;
  status: TripStatus;
}
export interface TripDTO extends TripSummary {
  userId: string;
  travelers: number;
  source: string | null;
  summary: string | null;
  budget: Plan['budget'] | null;
  tips: string[];
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  days: DayDTO[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapSummary = (r: any): TripSummary => ({
  id: r.id,
  title: r.title,
  origin: r.origin,
  clusters: r.clusters,
  destinations: r.destinations,
  startDate: r.start_date,
  endDate: r.end_date,
  budgetTier: r.budget_tier,
  status: r.status,
});

const mapItem = (r: any): ItemDTO => ({
  id: r.id,
  title: r.title,
  description: r.description ?? '',
  location: r.location ?? '',
  destination: r.destination ?? '',
  lat: r.lat,
  lng: r.lng,
  startTime: r.start_time,
  durationMin: r.duration_min,
  estCostInr: r.est_cost_inr,
  category: r.category,
  indoor: r.indoor,
  legDistanceKm: r.leg_distance_km,
  legDurationMin: r.leg_duration_min,
  ghat: r.ghat,
});

async function insertDays(c: PoolClient, tripId: string, days: Day[]): Promise<void> {
  for (const d of days) {
    await c.query(
      `INSERT INTO itinerary_days (trip_id, day_number, theme, summary) VALUES ($1,$2,$3,$4)
       ON CONFLICT (trip_id, day_number) DO UPDATE SET theme = EXCLUDED.theme, summary = EXCLUDED.summary`,
      [tripId, d.dayNumber, d.theme, d.summary],
    );
    for (const [i, a] of d.activities.entries()) {
      await c.query(
        `INSERT INTO itinerary_items (trip_id, day_number, position, title, description, location, destination, lat, lng,
           start_time, duration_min, est_cost_inr, category, indoor, leg_distance_km, leg_duration_min, ghat)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [tripId, d.dayNumber, i, a.title, a.description, a.location, a.destination, a.lat, a.lng, a.startTime, a.durationMin,
         a.estCostInr, a.category, a.indoor, a.legDistanceKm ?? null, a.legDurationMin ?? null, a.ghat ?? null],
      );
    }
  }
}

export const itineraryRepository = {
  async create(id: string, userId: string, p: TripParams): Promise<void> {
    await pool.query(
      `INSERT INTO itineraries (id, user_id, origin, clusters, destinations, start_date, end_date, budget_tier, travelers, params, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING')`,
      [id, userId, p.origin, p.clusters, p.destinations, p.startDate, p.endDate, p.budgetTier, p.travelers, JSON.stringify(p)],
    );
  },

  async list(userId: string): Promise<TripSummary[]> {
    const r = await pool.query('SELECT * FROM itineraries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
    return r.rows.map(mapSummary);
  },

  async get(id: string): Promise<TripDTO | null> {
    const t = await pool.query('SELECT * FROM itineraries WHERE id = $1', [id]);
    const row = t.rows[0];
    if (!row) return null;
    const [days, items] = await Promise.all([
      pool.query('SELECT * FROM itinerary_days WHERE trip_id = $1 ORDER BY day_number', [id]),
      pool.query('SELECT * FROM itinerary_items WHERE trip_id = $1 ORDER BY day_number, position', [id]),
    ]);
    return {
      ...mapSummary(row),
      userId: row.user_id,
      travelers: row.travelers,
      source: row.source,
      summary: row.summary,
      budget: row.budget,
      tips: row.tips,
      failureReason: row.failure_reason,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      days: days.rows.map((d: any) => ({
        dayNumber: d.day_number,
        date: addDays(row.start_date, d.day_number - 1),
        theme: d.theme ?? '',
        summary: d.summary ?? '',
        activities: items.rows.filter((i: any) => i.day_number === d.day_number).map(mapItem),
      })),
    };
  },

  async markGenerating(id: string): Promise<void> {
    await pool.query(`UPDATE itineraries SET status='GENERATING', updated_at=now() WHERE id=$1 AND status='PENDING'`, [id]);
  },

  async markFailed(id: string, reason: string): Promise<void> {
    await pool.query(`UPDATE itineraries SET status='FAILED', failure_reason=$2, updated_at=now() WHERE id=$1`, [id, reason]);
  },

  async setStatus(id: string, status: TripStatus, onlyFrom: TripStatus[]): Promise<void> {
    await pool.query('UPDATE itineraries SET status=$2, updated_at=now() WHERE id=$1 AND status = ANY($3)', [id, status, onlyFrom]);
  },

  async savePlan(id: string, plan: Plan, source: string): Promise<void> {
    await withTransaction(pool, async (c) => {
      await c.query('DELETE FROM itinerary_days WHERE trip_id = $1', [id]);
      await insertDays(c, id, plan.days);
      await c.query(
        `UPDATE itineraries SET status='READY', source=$2, title=$3, summary=$4, budget=$5, tips=$6, failure_reason=NULL, updated_at=now() WHERE id=$1`,
        [id, source, plan.title, plan.summary, JSON.stringify(plan.budget), plan.tips],
      );
    });
  },

  /** Replace whole days (used by reroute acceptance). */
  async applyChangedDays(id: string, days: Day[]): Promise<void> {
    await withTransaction(pool, async (c) => {
      await c.query('DELETE FROM itinerary_items WHERE trip_id = $1 AND day_number = ANY($2)', [id, days.map((d) => d.dayNumber)]);
      await insertDays(c, id, days);
      await c.query(`UPDATE itineraries SET status='READY', updated_at=now() WHERE id=$1`, [id]);
    });
  },

  async updateLegs(id: string, legs: { dayNumber: number; position: number; distanceKm: number; durationMin: number; ghat: boolean }[]): Promise<void> {
    await withTransaction(pool, async (c) => {
      for (const l of legs) {
        await c.query(
          `UPDATE itinerary_items SET leg_distance_km=$4, leg_duration_min=$5, ghat=$6 WHERE trip_id=$1 AND day_number=$2 AND position=$3`,
          [id, l.dayNumber, l.position, l.distanceKm, l.durationMin, l.ghat],
        );
      }
    });
  },

  /** Reorder activities in a day; start times stay as an ordered set of slots and are reassigned in the new order. */
  async reorder(id: string, dayNumber: number, orderedIds: string[]): Promise<void> {
    await withTransaction(pool, async (c) => {
      const r = await c.query('SELECT id, start_time FROM itinerary_items WHERE trip_id=$1 AND day_number=$2 ORDER BY position FOR UPDATE', [id, dayNumber]);
      const existing = new Set<string>(r.rows.map((x: any) => x.id));
      if (existing.size !== orderedIds.length || new Set(orderedIds).size !== orderedIds.length || orderedIds.some((i) => !existing.has(i))) {
        throw badRequest('orderedItemIds must contain every activity of the day exactly once');
      }
      const slots: string[] = r.rows.map((x: any) => x.start_time as string).sort();
      for (let i = 0; i < orderedIds.length; i++) {
        await c.query(
          'UPDATE itinerary_items SET position=$2, start_time=$3, leg_distance_km=NULL, leg_duration_min=NULL, ghat=NULL WHERE id=$1',
          [orderedIds[i], i, slots[i]],
        );
      }
      await c.query('UPDATE itineraries SET updated_at=now() WHERE id=$1', [id]);
    });
  },

  async completeFinished(): Promise<{ id: string; user_id: string }[]> {
    const r = await pool.query(
      `UPDATE itineraries SET status='COMPLETED', updated_at=now()
        WHERE end_date < CURRENT_DATE AND status IN ('READY','DISRUPTED') RETURNING id, user_id`,
    );
    return r.rows;
  },
};
