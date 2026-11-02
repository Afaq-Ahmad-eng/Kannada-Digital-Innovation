import '@kta/service-kit/dist/tracing';
import cookieParser from 'cookie-parser';
import { createApp, finalizeApp, startService, trustGateway } from '@kta/service-kit';
import { env } from './config';
import { initDatabase, pool, redis } from './database';
import { authRouter } from './modules/auth/auth.routes';
import { registerConsumers, seedAdmin } from './modules/auth/auth.events';
import { bus } from './shared/bus';
import { log } from './shared/logger';

const app = createApp('auth-service', log);
app.use(cookieParser());
app.use('/api', trustGateway(env.INTERNAL_API_KEY));
app.use('/api/v1/auth', authRouter);
finalizeApp(app, log);

void startService({
  app,
  port: env.PORT,
  log,
  init: async () => {
    await initDatabase();
    await seedAdmin();
    await registerConsumers();
  },
  shutdown: async () => {
    await bus.close();
    await pool.end();
    redis.disconnect();
  },
});
