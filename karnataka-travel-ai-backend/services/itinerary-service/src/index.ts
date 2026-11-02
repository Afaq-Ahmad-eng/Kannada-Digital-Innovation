import '@kta/service-kit/dist/tracing';
import { createApp, finalizeApp, startService, trustGateway } from '@kta/service-kit';
import { env } from './config';
import { initDatabase, pool } from './database';
import { registerConsumers } from './modules/itinerary/itinerary.events';
import { startCompletionJob } from './modules/itinerary/itinerary.jobs';
import { itineraryRouter } from './modules/itinerary/itinerary.routes';
import { bus } from './shared/bus';
import { log } from './shared/logger';

const app = createApp('itinerary-service', log);
app.use('/api', trustGateway(env.INTERNAL_API_KEY));
app.use('/api/v1/itineraries', itineraryRouter);
finalizeApp(app, log);

let job: NodeJS.Timeout | undefined;
void startService({
  app,
  port: env.PORT,
  log,
  init: async () => {
    await initDatabase();
    await bus.connectProducer();
    await registerConsumers();
    job = startCompletionJob();
  },
  shutdown: async () => {
    if (job) clearInterval(job);
    await bus.close();
    await pool.end();
  },
});
