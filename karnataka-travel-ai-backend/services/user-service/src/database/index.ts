import { createPool, migrate } from '@kta/service-kit';
import type { Pool } from '@kta/service-kit';
import { env } from '../config';
import { log } from '../shared/logger';

export const pool: Pool = createPool(env.DATABASE_URL, log);

export async function initDatabase(): Promise<void> {
  await migrate(
    pool,
    `CREATE TABLE IF NOT EXISTS users (
       id UUID PRIMARY KEY,
       email TEXT NOT NULL UNIQUE,
       full_name TEXT NOT NULL,
       phone TEXT,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     CREATE TABLE IF NOT EXISTS preferences (
       user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
       contact_channels TEXT[] NOT NULL DEFAULT '{EMAIL}',
       travel_pace TEXT NOT NULL DEFAULT 'BALANCED',
       dietary TEXT NOT NULL DEFAULT 'NONE',
       accessibility TEXT[] NOT NULL DEFAULT '{}',
       default_budget_tier TEXT NOT NULL DEFAULT 'MODERATE',
       home_city TEXT,
       preferred_language TEXT NOT NULL DEFAULT 'en',
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );`,
  );
}
