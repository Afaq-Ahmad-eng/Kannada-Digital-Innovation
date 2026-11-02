import { createLogger } from '@kta/logger';
import { EventBus } from '@kta/kafka-events';
import { GeminiClient, createPool, createRedis } from '@kta/service-kit';
import type { Pool } from '@kta/service-kit';
import { env } from './config';

export const log = createLogger('ai-itinerary-worker');
export const bus = new EventBus('ai-itinerary-worker', env.KAFKA_BROKERS.split(','), log, {
  ssl: env.KAFKA_SSL,
  username: env.KAFKA_USERNAME,
  password: env.KAFKA_PASSWORD,
  saslMechanism: env.KAFKA_SASL_MECHANISM,
  caCertBase64: env.KAFKA_CA_CERT_BASE64,
});
export const gemini = new GeminiClient(
  { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, embedModel: env.GEMINI_EMBED_MODEL, embedDims: env.EMBED_DIMS },
  log,
);
export const pool: Pool = createPool(env.DATABASE_URL, log);
export const redis = createRedis(env.REDIS_URL, log);
