import type { Express } from 'express';
import type { Logger } from '@kta/logger';

export function registerShutdown(log: Logger, fn: () => Promise<void>): void {
  let closing = false;
  const stop = async (signal: string) => {
    if (closing) return;
    closing = true;
    log.info({ signal }, 'shutting down');
    await fn().catch((err) => log.error({ err }, 'error during shutdown'));
    process.exit(0);
  };
  process.on('SIGTERM', () => void stop('SIGTERM'));
  process.on('SIGINT', () => void stop('SIGINT'));
}

/** Run init hooks, then listen. Exits the process on init failure so orchestrators restart the container. */
export async function startService(o: {
  app: Express;
  port: number;
  log: Logger;
  init?: () => Promise<void>;
  shutdown?: () => Promise<void>;
}): Promise<void> {
  try {
    await o.init?.();
  } catch (err) {
    o.log.fatal({ err }, 'service failed to initialise');
    process.exit(1);
  }
  const server = o.app.listen(o.port, () => o.log.info({ port: o.port }, 'service listening'));
  registerShutdown(o.log, async () => {
    server.close();
    await o.shutdown?.();
  });
}
