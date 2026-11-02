import { commonEnv, loadEnv, optStr, z } from '@kta/service-kit';

export const env = loadEnv({
  ...commonEnv,
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TTL_SECONDS: z.coerce.number().int().default(900),
  REFRESH_TTL_SECONDS: z.coerce.number().int().default(60 * 60 * 24 * 7),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  ADMIN_EMAIL: optStr,
  ADMIN_PASSWORD: optStr,
});
