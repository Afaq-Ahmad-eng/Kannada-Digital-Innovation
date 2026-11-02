import http from 'http';
import type { RequestHandler } from 'express';
import client from 'prom-client';
import type { Logger } from '@kta/logger';

client.collectDefaultMetrics();

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['service', 'method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.6, 1, 2, 5],
});

export const jobsProcessed = new client.Counter({
  name: 'worker_jobs_total',
  help: 'Async jobs processed by workers',
  labelNames: ['worker', 'outcome'],
});

export function metricsMiddleware(service: string): RequestHandler {
  return (req, res, next) => {
    const end = httpDuration.startTimer();
    res.on('finish', () => end({ service, method: req.method, route: req.route?.path ?? 'unmatched', status: res.statusCode }));
    next();
  };
}

export const metricsHandler: RequestHandler = async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
};

/** Tiny HTTP server exposing /metrics for non-HTTP workers. */
export function startMetricsServer(port: number, log: Logger): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } else {
      res.statusCode = req.url === '/health' ? 200 : 404;
      res.end(req.url === '/health' ? 'ok' : 'not found');
    }
  });
  server.listen(port, () => log.info({ port }, 'metrics server listening'));
  return server;
}
