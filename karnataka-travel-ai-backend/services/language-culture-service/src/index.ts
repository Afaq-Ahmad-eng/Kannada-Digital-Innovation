import '@kta/service-kit/dist/tracing';
import { createApp, finalizeApp, startService, trustGateway } from '@kta/service-kit';
import { env } from './config';
import { initDatabase, pool } from './database';
import { culturalRouter } from './modules/cultural-rag/rag.routes';
import { seedKnowledge } from './modules/cultural-rag/rag.service';
import { translationRouter } from './modules/translation/translation.routes';
import { log } from './shared/logger';

const app = createApp('language-culture-service', log);
app.use('/api', trustGateway(env.INTERNAL_API_KEY));
app.use('/api/v1/language', translationRouter);
app.use('/api/v1/language', culturalRouter);
finalizeApp(app, log);

void startService({
  app,
  port: env.PORT,
  log,
  init: async () => {
    await initDatabase();
    await seedKnowledge();
  },
  shutdown: async () => {
    await pool.end();
  },
});
