import Redis from 'ioredis';
import type { Logger } from '@kta/logger';

export function createRedis(url: string, log: Logger): Redis {
  const redis = new Redis(url, { maxRetriesPerRequest: 3 });
  redis.on('error', (err) => log.error({ err }, 'redis error'));
  return redis;
}
export type { Redis };
