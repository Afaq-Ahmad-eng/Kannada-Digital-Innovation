import type { Request, Response } from 'express';
import type { ServerResponse } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from '../config';
import { CircuitBreaker } from '../middlewares/circuit-breaker';
import { log } from '../shared';

export interface Upstream {
  name: string;
  prefix: string;
  target: string;
  /** Prefix-relative paths that skip JWT auth. */
  publicPaths?: { method: string; path: string }[];
}

export const upstreams: Upstream[] = [
  { name: 'auth-service', prefix: '/api/v1/auth', target: env.AUTH_SERVICE_URL },
  { name: 'user-service', prefix: '/api/v1/users', target: env.USER_SERVICE_URL, publicPaths: [{ method: 'POST', path: '/register' }] },
  { name: 'itinerary-service', prefix: '/api/v1/itineraries', target: env.ITINERARY_SERVICE_URL },
  { name: 'alert-service', prefix: '/api/v1/alerts', target: env.ALERT_SERVICE_URL },
  { name: 'reroute-service', prefix: '/api/v1/reroute', target: env.REROUTE_SERVICE_URL },
  { name: 'language-culture-service', prefix: '/api/v1/language', target: env.LANGUAGE_SERVICE_URL },
  { name: 'admin-service', prefix: '/api/v1/admin', target: env.ADMIN_SERVICE_URL },
];

/** Reverse proxy with an internal key, circuit breaker and JSON errors. Bodies are streamed, never buffered (multipart + SSE safe). */
export function createUpstreamProxy(u: Upstream, breaker: CircuitBreaker) {
  return createProxyMiddleware<Request, Response>({
    target: u.target,
    changeOrigin: true,
    pathFilter: u.prefix,
    proxyTimeout: 0,
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('x-internal-key', env.INTERNAL_API_KEY);
      },
      proxyRes: (proxyRes) => {
        if ((proxyRes.statusCode ?? 500) >= 500) breaker.failure();
        else breaker.success();
      },
      error: (err, _req, res) => {
        breaker.failure();
        log.error({ err: err.message, upstream: u.name }, 'proxy error');
        const r = res as ServerResponse;
        if (!r.headersSent) r.writeHead(502, { 'content-type': 'application/json' });
        r.end(JSON.stringify({ error: { code: 'BAD_GATEWAY', message: `${u.name} did not respond` } }));
      },
    },
  });
}
