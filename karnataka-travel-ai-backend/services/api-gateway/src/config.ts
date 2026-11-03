import { commonEnv, loadEnv, z } from '@kta/service-kit';

export const env = loadEnv({
  ...commonEnv,
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .refine((origins) => origins.length > 0, 'CORS_ORIGIN must contain at least one origin'),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().default(300),
  AUTH_SERVICE_URL: z.string().url(),
  USER_SERVICE_URL: z.string().url(),
  ITINERARY_SERVICE_URL: z.string().url(),
  ALERT_SERVICE_URL: z.string().url(),
  REROUTE_SERVICE_URL: z.string().url(),
  LANGUAGE_SERVICE_URL: z.string().url(),
  ADMIN_SERVICE_URL: z.string().url().default('http://admin-service:3000'),
});
