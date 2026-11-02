import { commonEnv, geminiEnv, loadEnv, z } from '@kta/service-kit';

export const env = loadEnv({
  ...commonEnv,
  ...geminiEnv,
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CACHE_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.95),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).default(2),
  METRICS_PORT: z.coerce.number().int().default(9100),
});
