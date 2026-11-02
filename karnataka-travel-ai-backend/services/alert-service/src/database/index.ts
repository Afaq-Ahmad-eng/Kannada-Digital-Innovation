import { createPool, createRedis, migrate } from '@kta/service-kit';
import type { Pool } from '@kta/service-kit';
import { env } from '../config';
import { log } from '../shared/logger';

export const pool: Pool = createPool(env.DATABASE_URL, log);
export const redis = createRedis(env.REDIS_URL, log);

export async function initDatabase(): Promise<void> {
  await migrate(
    pool,
    `CREATE TABLE IF NOT EXISTS contacts (
       user_id UUID PRIMARY KEY,
       email TEXT,
       full_name TEXT,
       phone TEXT,
       channels TEXT[] NOT NULL DEFAULT '{EMAIL}'
     );
     CREATE TABLE IF NOT EXISTS active_trips (
       trip_id UUID PRIMARY KEY,
       user_id UUID NOT NULL,
       regions TEXT[] NOT NULL,
       start_date DATE NOT NULL,
       end_date DATE NOT NULL,
       status TEXT NOT NULL DEFAULT 'ACTIVE'
     );
     CREATE TABLE IF NOT EXISTS alerts (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       trip_id UUID NOT NULL,
       user_id UUID NOT NULL,
       region TEXT NOT NULL,
       severity TEXT NOT NULL,
       category TEXT,
       headline TEXT NOT NULL,
       details TEXT,
       sources JSONB NOT NULL DEFAULT '[]',
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts (user_id, created_at DESC);`,
  );
}
