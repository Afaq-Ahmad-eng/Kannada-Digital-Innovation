import { cosine, decodeVector, encodeVector } from '@kta/service-kit';
import type { Plan } from '@kta/shared-types';
import { env } from '../config';
import { log, redis } from '../shared';

const MAX_ENTRIES_PER_BUCKET = 100;
const TTL_SECONDS = 7 * 24 * 3600;

/**
 * Redis semantic cache.
 *  - "bucket" = hard constraints that must match exactly (origin, destinations, days, budget, pace, diet).
 *  - within a bucket, cosine similarity of the parameter embedding must exceed CACHE_SIMILARITY_THRESHOLD (default 0.95).
 * Implementation is a brute-force scan over <=100 vectors per bucket. For large scale, swap in a RediSearch / Redis Stack vector index.
 */
export const semanticCache = {
  async lookup(bucket: string, embedding: number[]): Promise<{ plan: Plan; similarity: number } | null> {
    const entries = await redis.hgetall(`semcache:${bucket}:emb`);
    let bestId: string | null = null;
    let best = 0;
    for (const [id, enc] of Object.entries(entries)) {
      const sim = cosine(embedding, decodeVector(enc));
      if (sim > best) {
        best = sim;
        bestId = id;
      }
    }
    if (!bestId || best < env.CACHE_SIMILARITY_THRESHOLD) return null;
    const raw = await redis.get(`semcache:plan:${bestId}`);
    if (!raw) return null;
    log.info({ bucket, similarity: best }, 'semantic cache hit');
    return { plan: JSON.parse(raw) as Plan, similarity: best };
  },

  async store(bucket: string, id: string, embedding: number[], plan: Plan): Promise<void> {
    const embKey = `semcache:${bucket}:emb`;
    const idxKey = `semcache:${bucket}:idx`;
    await redis
      .multi()
      .hset(embKey, id, encodeVector(embedding))
      .zadd(idxKey, Date.now(), id)
      .set(`semcache:plan:${id}`, JSON.stringify(plan), 'EX', TTL_SECONDS)
      .expire(embKey, TTL_SECONDS)
      .expire(idxKey, TTL_SECONDS)
      .exec();
    const overflow = (await redis.zcard(idxKey)) - MAX_ENTRIES_PER_BUCKET;
    if (overflow > 0) {
      const oldest = await redis.zrange(idxKey, 0, overflow - 1);
      if (oldest.length) await redis.multi().zrem(idxKey, ...oldest).hdel(embKey, ...oldest).del(...oldest.map((o) => `semcache:plan:${o}`)).exec();
    }
  },
};
