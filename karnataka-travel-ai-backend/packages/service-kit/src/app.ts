import express, { Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import type { Logger } from '@kta/logger';
import { errorHandler, notFoundHandler } from './errors';
import { metricsHandler, metricsMiddleware } from './metrics';

/** Express app with security headers, request logging, metrics, health and JSON parsing. */
export function createApp(name: string, log: Logger): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(helmet());
  app.use(pinoHttp({ logger: log, autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/metrics' } }));
  app.use(metricsMiddleware(name));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: name, uptime: process.uptime() }));
  app.get('/metrics', metricsHandler);
  app.use(express.json({ limit: '1mb' }));
  return app;
}

/** Mount after all routes: 404 + centralized error handling. */
export function finalizeApp(app: Express, log: Logger): void {
  app.use(notFoundHandler);
  app.use(errorHandler(log));
}
