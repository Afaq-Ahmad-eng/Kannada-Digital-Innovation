import '@kta/service-kit/dist/tracing';
import { createApp, finalizeApp, startService, trustGateway } from '@kta/service-kit';
import { env } from './config';
import { initDatabase, pool } from './database';
import { registerConsumers } from './modules/adjustment/adjustment.events';
import { adjustmentRouter } from './modules/adjustment/adjustment.routes';
import { bus } from './shared/bus';
import { log } from './shared/logger';

const app = createApp('reroute-service', log);
app.use('/api', trustGateway(env.INTERNAL_API_KEY));
app.use('/api/v1/reroute', adjustmentRouter);
finalizeApp(app, log);

void startService({
  app,
  port: env.PORT,
  log,
  init: async () => {
    await initDatabase();
    await bus.connectProducer();
    await registerConsumers();
  },
  shutdown: async () => {
    await bus.close();
    await pool.end();
  },
});
