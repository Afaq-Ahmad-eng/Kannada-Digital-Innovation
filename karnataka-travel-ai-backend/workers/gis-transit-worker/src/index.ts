import '@kta/service-kit/dist/tracing';
import { registerShutdown, startMetricsServer } from '@kta/service-kit';
import { env } from './config';
import { bus, log } from './shared';
import { startWorker } from './worker';

startMetricsServer(env.METRICS_PORT, log);
startWorker().catch((err) => {
  log.fatal({ err }, 'worker failed to start');
  process.exit(1);
});
registerShutdown(log, async () => {
  await bus.close();
});
