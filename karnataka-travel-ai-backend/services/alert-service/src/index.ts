import '@kta/service-kit/dist/tracing';
import { createApp, finalizeApp, startService, trustGateway } from '@kta/service-kit';
import { env } from './config';
import { initDatabase, pool, redis } from './database';
import { dispatchRouter } from './modules/dispatch/dispatch.routes';
import { registerConsumers } from './modules/monitoring/monitoring.events';
import { monitoringRouter, startScanner } from './modules/monitoring/monitoring.routes';
import { bus } from './shared/bus';
import { log } from './shared/logger';

const app = createApp('alert-service', log);
app.use('/api', trustGateway(env.INTERNAL_API_KEY));
app.use('/api/v1/alerts', monitoringRouter);
app.use('/api/v1/alerts', dispatchRouter);
finalizeApp(app, log);

void startService({
  app,
  port: env.PORT,
  log,
  init: async () => {
    await initDatabase();
    await bus.connectProducer();
    await registerConsumers();
    startScanner();
  },
  shutdown: async () => {
    await bus.close();
    await pool.end();
    redis.disconnect();
  },
});
