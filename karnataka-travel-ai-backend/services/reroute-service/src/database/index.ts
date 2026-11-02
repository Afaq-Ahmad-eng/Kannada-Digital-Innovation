import { createPool, migrate } from '@kta/service-kit';
import type { Pool } from '@kta/service-kit';
import { env } from '../config';
import { log } from '../shared/logger';

export const pool: Pool = createPool(env.DATABASE_URL, log);

export async function initDatabase(): Promise<void> {
  await migrate(
    pool,
    `CREATE TABLE IF NOT EXISTS trip_snapshots (
       trip_id UUID PRIMARY KEY,
       user_id UUID NOT NULL,
       plan JSONB NOT NULL,
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     CREATE TABLE IF NOT EXISTS proposals (
       id UUID PRIMARY KEY,
       trip_id UUID NOT NULL,
       user_id UUID NOT NULL,
       status TEXT NOT NULL DEFAULT 'PROPOSED',
       region TEXT NOT NULL,
       reason TEXT NOT NULL,
       summary TEXT NOT NULL,
       changed_days JSONB NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     CREATE INDEX IF NOT EXISTS idx_proposals_trip ON proposals (trip_id, status);`,
  );
}
