import { createHash } from 'crypto';
import type { RequestHandler } from 'express';
import { AppError } from '@kta/service-kit';
import { env } from '../config';

interface Claims {
  sub: string;
  role: string;
  email: string;
}

const CACHE_TTL_MS = 5_000; // short introspection cache; revocation propagates within seconds
const cache = new Map<string, { claims: Claims; exp: number }>();

async function introspect(token: string): Promise<Claims> {
  const k = createHash('sha256').update(token).digest('hex');
  const hit = cache.get(k);
  if (hit && hit.exp > Date.now()) return hit.claims;

  let res: Response;
  try {
    res = await fetch(`${env.AUTH_SERVICE_URL}/api/v1/auth/verify-token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-key': env.INTERNAL_API_KEY },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    throw new AppError(503, 'Authentication service unavailable', 'AUTH_UNAVAILABLE');
  }
  if (res.status === 401) throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  if (!res.ok) throw new AppError(503, 'Authentication service unavailable', 'AUTH_UNAVAILABLE');
  const { claims } = (await res.json()) as { claims: Claims };
  if (cache.size > 2000) cache.clear();
  cache.set(k, { claims, exp: Date.now() + CACHE_TTL_MS });
  return claims;
}

/** Never trust identity headers coming from the internet. */
export const stripIdentityHeaders: RequestHandler = (req, _res, next) => {
  for (const h of ['x-user-id', 'x-user-role', 'x-user-email', 'x-internal-key']) delete req.headers[h];
  next();
};

export const authGuard: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');
    const claims = await introspect(header.slice(7));
    req.headers['x-user-id'] = claims.sub;
    req.headers['x-user-role'] = claims.role;
    req.headers['x-user-email'] = claims.email;
    next();
  } catch (err) {
    next(err);
  }
};
