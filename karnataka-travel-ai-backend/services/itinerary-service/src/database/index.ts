import { createPool, migrate } from '@kta/service-kit';
import type { Pool } from '@kta/service-kit';
import { env } from '../config';
import { log } from '../shared/logger';

export const pool: Pool = createPool(env.DATABASE_URL, log);

export async function initDatabase(): Promise<void> {
  await migrate(
    pool,
    `CREATE TABLE IF NOT EXISTS itineraries (
       id UUID PRIMARY KEY,
       user_id UUID NOT NULL,
       origin TEXT NOT NULL,
       clusters TEXT[] NOT NULL,
       destinations TEXT[] NOT NULL DEFAULT '{}',
       start_date DATE NOT NULL,
       end_date DATE NOT NULL,
       budget_tier TEXT NOT NULL,
       travelers INT NOT NULL,
       params JSONB NOT NULL,
       status TEXT NOT NULL DEFAULT 'PENDING',
       source TEXT,
       title TEXT,
       summary TEXT,
       budget JSONB,
       tips TEXT[] NOT NULL DEFAULT '{}',
       failure_reason TEXT,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     CREATE INDEX IF NOT EXISTS idx_itineraries_user ON itineraries (user_id, created_at DESC);
     CREATE TABLE IF NOT EXISTS itinerary_days (
       trip_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
       day_number INT NOT NULL,
       theme TEXT,
       summary TEXT,
       PRIMARY KEY (trip_id, day_number)
     );
     CREATE TABLE IF NOT EXISTS itinerary_items (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       trip_id UUID NOT NULL,
       day_number INT NOT NULL,
       position INT NOT NULL,
       title TEXT NOT NULL,
       description TEXT,
       location TEXT,
       destination TEXT,
       lat DOUBLE PRECISION,
       lng DOUBLE PRECISION,
       start_time TEXT,
       duration_min INT,
       est_cost_inr NUMERIC(12,2),
       category TEXT,
       indoor BOOLEAN,
       leg_distance_km NUMERIC(8,2),
       leg_duration_min INT,
       ghat BOOLEAN,
       FOREIGN KEY (trip_id, day_number) REFERENCES itinerary_days (trip_id, day_number) ON DELETE CASCADE
     );
     CREATE INDEX IF NOT EXISTS idx_items_trip_day ON itinerary_items (trip_id, day_number, position);`,
  );
}
