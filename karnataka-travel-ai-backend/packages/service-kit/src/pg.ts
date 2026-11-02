import { Pool, PoolClient, types } from 'pg';
import type { Logger } from '@kta/logger';

// DATE -> 'YYYY-MM-DD' string (avoid timezone shifts), NUMERIC -> number, BIGINT -> number
types.setTypeParser(1082, (v: string) => v);
types.setTypeParser(1700, (v: string) => parseFloat(v));
types.setTypeParser(20, (v: string) => parseInt(v, 10));

export function createPool(connectionString: string, log: Logger): Pool {
  const pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  pool.on('error', (err) => log.error({ err }, 'postgres pool error'));
  return pool;
}

export async function migrate(pool: Pool, sql: string): Promise<void> {
  await pool.query(sql);
}

export async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
