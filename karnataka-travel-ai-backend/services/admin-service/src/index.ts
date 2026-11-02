import '@kta/service-kit/dist/tracing';
import { createApp, finalizeApp, requireRole, startService, trustGateway } from '@kta/service-kit';
import { env } from './config';
import { initDatabase, pool } from './database';
import { auditRouter } from './modules/audit/audit.routes';
import { operationsRouter } from './modules/operations/operations.routes';
import { overviewRouter } from './modules/overview/overview.routes';
import { registerConsumers } from './modules/readmodel/readmodel.events';
import { tripsRouter } from './modules/trips/trips.routes';
import { usersRouter } from './modules/users/users.routes';
import { bus } from './shared/bus';
import { log } from './shared/logger';

const app = createApp('admin-service', log);
app.use('/api', trustGateway(env.INTERNAL_API_KEY));
// Every admin route requires an authenticated ADMIN (identity is injected by the gateway after JWT introspection).
app.use('/api/v1/admin', requireRole('ADMIN'), overviewRouter, usersRouter, tripsRouter, operationsRouter, auditRouter);
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
