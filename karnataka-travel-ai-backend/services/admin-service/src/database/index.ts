import { createPool, migrate } from '@kta/service-kit';
import { env } from '../config';
import { log } from '../shared/logger';

export const pool = createPool(env.DATABASE_URL, log);

/**
 * admin_db is a read model fed by Kafka events (no access to other services' databases) plus the audit log.
 */
export async function initDatabase(): Promise<void> {
  await migrate(
    pool,
    `CREATE TABLE IF NOT EXISTS users (
       id UUID PRIMARY KEY,
       email TEXT NOT NULL,
       full_name TEXT,
       phone TEXT,
       registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       disabled BOOLEAN NOT NULL DEFAULT false,
       disabled_reason TEXT,
       disabled_at TIMESTAMPTZ
     );
     CREATE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));
     CREATE TABLE IF NOT EXISTS trips (
       id UUID PRIMARY KEY,
       user_id UUID NOT NULL,
       origin TEXT,
       destinations TEXT[] NOT NULL DEFAULT '{}',
       start_date DATE,
       end_date DATE,
       budget_tier TEXT,
       travelers INT,
       status TEXT NOT NULL DEFAULT 'PENDING',
       source TEXT,
       failure_reason TEXT,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (status, created_at DESC);
     CREATE INDEX IF NOT EXISTS idx_trips_user ON trips (user_id);
     CREATE TABLE IF NOT EXISTS disruptions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       trip_id UUID NOT NULL,
       user_id UUID NOT NULL,
       region TEXT NOT NULL,
       severity TEXT NOT NULL,
       category TEXT,
       headline TEXT NOT NULL,
       detected_at TIMESTAMPTZ NOT NULL,
       UNIQUE (trip_id, region, headline, detected_at)
     );
     CREATE INDEX IF NOT EXISTS idx_disruptions_time ON disruptions (detected_at DESC);
     CREATE TABLE IF NOT EXISTS reroutes (
       proposal_id UUID PRIMARY KEY,
       trip_id UUID NOT NULL,
       user_id UUID NOT NULL,
       summary TEXT,
       reason TEXT,
       status TEXT NOT NULL DEFAULT 'PROPOSED',
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     CREATE INDEX IF NOT EXISTS idx_reroutes_trip ON reroutes (trip_id);
     CREATE TABLE IF NOT EXISTS audit_log (
       id BIGSERIAL PRIMARY KEY,
       actor_id TEXT NOT NULL,
       actor_email TEXT,
       action TEXT NOT NULL,
       target_type TEXT,
       target_id TEXT,
       detail JSONB NOT NULL DEFAULT '{}',
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
     );
     CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log (created_at DESC);`,
  );
}
