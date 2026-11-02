import '@kta/service-kit/dist/tracing';
import { createApp, finalizeApp, startService, trustGateway } from '@kta/service-kit';
import { env } from './config';
import { initDatabase, pool } from './database';
import { profileRouter } from './modules/profile/profile.routes';
import { bus } from './shared/bus';
import { log } from './shared/logger';

const app = createApp('user-service', log);
app.use('/api', trustGateway(env.INTERNAL_API_KEY));
app.use('/api/v1/users', profileRouter);
finalizeApp(app, log);

void startService({
  app,
  port: env.PORT,
  log,
  init: async () => {
    await initDatabase();
    await bus.connectProducer();
  },
  shutdown: async () => {
    await bus.close();
    await pool.end();
  },
});
