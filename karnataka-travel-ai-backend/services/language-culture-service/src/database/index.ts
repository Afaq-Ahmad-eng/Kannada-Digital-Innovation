import { createPool, migrate } from '@kta/service-kit';
import type { Pool } from '@kta/service-kit';
import { env } from '../config';
import { log } from '../shared/logger';

export const pool: Pool = createPool(env.DATABASE_URL, log);

export async function initDatabase(): Promise<void> {
  await migrate(
    pool,
    `CREATE EXTENSION IF NOT EXISTS vector;
     CREATE TABLE IF NOT EXISTS culture_docs (
       id TEXT PRIMARY KEY,
       topic TEXT NOT NULL,
       destination TEXT,
       title TEXT NOT NULL,
       content TEXT NOT NULL,
       embedding vector(${env.EMBED_DIMS}) NOT NULL
     );
     CREATE INDEX IF NOT EXISTS idx_culture_docs_embedding ON culture_docs USING hnsw (embedding vector_cosine_ops);`,
  );
}
