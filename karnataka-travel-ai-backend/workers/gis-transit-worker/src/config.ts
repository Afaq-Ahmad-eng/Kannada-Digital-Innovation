import { commonEnv, loadEnv, z } from '@kta/service-kit';

export const env = loadEnv({
  ...commonEnv,
  /** The public OSRM demo server is rate-limited and not for production; point this at your own OSRM instance. */
  OSRM_URL: z.string().default('https://router.project-osrm.org'),
  METRICS_PORT: z.coerce.number().int().default(9100),
});
