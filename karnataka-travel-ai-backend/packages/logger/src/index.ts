import pino, { Logger } from 'pino';

export type { Logger };

/** Structured Pino logger. Set LOG_PRETTY=true for human-readable local output. */
export function createLogger(service: string): Logger {
  const pretty = process.env.LOG_PRETTY === 'true';
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service },
    redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-internal-key"]', '*.password', '*.passwordHash'],
    ...(pretty ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {}),
  });
}
