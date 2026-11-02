import { createPool, createRedis, migrate } from '@kta/service-kit';
import type { Pool } from '@kta/service-kit';
import { env } from '../config';
import { log } from '../shared/logger';

export const pool: Pool = createPool(env.DATABASE_URL, log);
export const redis = createRedis(env.REDIS_URL, log);

export async function initDatabase(): Promise<void> {
  await migrate(
    pool,
    `CREATE TABLE IF NOT EXISTS credentials (
       user_id UUID PRIMARY KEY,
       email TEXT NOT NULL UNIQUE,
       password_hash TEXT NOT NULL,
       role TEXT NOT NULL DEFAULT 'USER',
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     ALTER TABLE credentials ADD COLUMN IF NOT EXISTS disabled BOOLEAN NOT NULL DEFAULT false;`,
  );
}
