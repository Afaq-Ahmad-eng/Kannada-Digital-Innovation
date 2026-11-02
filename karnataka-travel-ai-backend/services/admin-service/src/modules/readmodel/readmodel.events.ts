import { Topics } from '@kta/kafka-events';
import { pool } from '../../database';
import { bus } from '../../shared/bus';

/**
 * Builds the admin read model from the same events the domain services emit.
 * Handlers are idempotent upserts so the consumer can replay from the beginning of the retained log.
 * Status updates are guarded so late or replayed events cannot move a trip backwards.
 */
export async function registerConsumers(): Promise<void> {
  await bus.subscribe(
    'admin-service',
    {
      [Topics.UserRegistered]: async (p) => {
        await pool.query(
          `INSERT INTO users (id, email, full_name, phone, registered_at) VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, phone = EXCLUDED.phone`,
          [p.userId, p.email, p.fullName, p.phone ?? null, p.createdAt],
        );
      },

      [Topics.TripRequested]: async (p) => {
        await pool.query(
          `INSERT INTO trips (id, user_id, origin, destinations, start_date, end_date, budget_tier, travelers)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET origin = EXCLUDED.origin, destinations = EXCLUDED.destinations, start_date = EXCLUDED.start_date,
             end_date = EXCLUDED.end_date, budget_tier = EXCLUDED.budget_tier, travelers = EXCLUDED.travelers`,
          [p.tripId, p.userId, p.params.origin, p.params.destinations, p.params.startDate, p.params.endDate, p.params.budgetTier, p.params.travelers],
        );
      },

      [Topics.ItineraryProgress]: async (p) => {
        if (p.stage === 'FAILED') {
          await pool.query(
            `INSERT INTO trips (id, user_id, status, failure_reason) VALUES ($1,$2,'FAILED',$3)
             ON CONFLICT (id) DO UPDATE SET status = 'FAILED', failure_reason = EXCLUDED.failure_reason, updated_at = now()`,
            [p.tripId, p.userId, p.message],
          );
        } else {
          await pool.query(
            `INSERT INTO trips (id, user_id, status) VALUES ($1,$2,'GENERATING')
             ON CONFLICT (id) DO UPDATE SET status = 'GENERATING', updated_at = now() WHERE trips.status = 'PENDING'`,
            [p.tripId, p.userId],
          );
        }
      },

      [Topics.ItineraryGenerated]: async (p) => {
        await pool.query(
          `INSERT INTO trips (id, user_id, status, source) VALUES ($1,$2,'READY',$3)
           ON CONFLICT (id) DO UPDATE SET source = EXCLUDED.source, updated_at = now(),
             status = CASE WHEN trips.status IN ('PENDING','GENERATING','FAILED') THEN 'READY' ELSE trips.status END`,
          [p.tripId, p.userId, p.source],
        );
      },

      [Topics.ItineraryDisrupted]: async (p) => {
        await pool.query(
          `INSERT INTO disruptions (trip_id, user_id, region, severity, category, headline, detected_at) VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT DO NOTHING`,
          [p.tripId, p.userId, p.region, p.severity, p.category, p.headline, p.detectedAt],
        );
        await pool.query(`UPDATE trips SET status = 'DISRUPTED', updated_at = now() WHERE id = $1 AND status IN ('READY','DISRUPTED')`, [p.tripId]);
      },

      [Topics.RerouteProposed]: async (p) => {
        await pool.query(
          `INSERT INTO reroutes (proposal_id, trip_id, user_id, summary, reason) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (proposal_id) DO NOTHING`,
          [p.proposalId, p.tripId, p.userId, p.summary, p.reason],
        );
      },

      [Topics.ItineraryRerouted]: async (p) => {
        if (p.origin !== 'REROUTE') return;
        await pool.query(`UPDATE reroutes SET status = 'APPLIED', updated_at = now() WHERE proposal_id = $1`, [p.proposalId]);
        await pool.query(`UPDATE trips SET status = 'READY', updated_at = now() WHERE id = $1 AND status = 'DISRUPTED'`, [p.tripId]);
      },

      [Topics.TripCompleted]: async (p) => {
        await pool.query(`UPDATE trips SET status = 'COMPLETED', updated_at = now() WHERE id = $1`, [p.tripId]);
      },
    },
    { fromBeginning: true },
  );
}
