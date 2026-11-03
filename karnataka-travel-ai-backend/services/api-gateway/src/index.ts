import '@kta/service-kit/dist/tracing';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { AppError, finalizeApp, metricsHandler, metricsMiddleware, startService } from '@kta/service-kit';
import { env } from './config';
import { authGuard, stripIdentityHeaders } from './middlewares/authenticate';
import { CircuitBreaker } from './middlewares/circuit-breaker';
import { createUpstreamProxy, upstreams } from './routes/proxy';
import { log } from './shared';

/**
 * Edge entrypoint. TLS termination / WAF / DDoS protection belong to the ingress in front of this process
 * (CDN, cloud load balancer, nginx or Kong); this service adds security headers, CORS, rate limiting,
 * JWT introspection and circuit-breaking, then forwards to internal services over HTTP.
 */
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(pinoHttp({ logger: log, autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/metrics' } }));
app.use(metricsMiddleware('api-gateway'));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));
app.get('/metrics', metricsHandler);

app.use(rateLimit({ windowMs: 60_000, limit: env.RATE_LIMIT_PER_MIN, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/v1/auth/login', rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/v1/users/register', rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(stripIdentityHeaders);

// Internal-only endpoint must never be reachable from the internet.
app.all('/api/v1/auth/verify-token', (_req, _res, next) => next(new AppError(404, 'Not found', 'NOT_FOUND')));

const breakers = new Map<string, CircuitBreaker>();
for (const u of upstreams) {
  const breaker = new CircuitBreaker(u.name);
  breakers.set(u.name, breaker);
  if (u.prefix !== '/api/v1/auth') {
    app.use(u.prefix, (req, res, next) => {
      const isPublic = u.publicPaths?.some((p) => p.method === req.method && p.path === req.path);
      return isPublic ? next() : authGuard(req, res, next);
    });
  }
  app.use(u.prefix, breaker.guard());
}
for (const u of upstreams) app.use(createUpstreamProxy(u, breakers.get(u.name)!));

finalizeApp(app, log);
void startService({ app, port: env.PORT, log });
