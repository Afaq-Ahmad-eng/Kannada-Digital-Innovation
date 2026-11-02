import { commonEnv, geminiEnv, loadEnv, optStr, z } from '@kta/service-kit';

export const env = loadEnv({
  ...commonEnv,
  ...geminiEnv,
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SCAN_ENABLED: z.enum(['true', 'false']).default('true'),
  SCAN_CRON: z.string().default('*/15 * * * *'),
  ENABLE_DEMO_ENDPOINTS: z.enum(['true', 'false']).default('false'),
  SMTP_HOST: optStr,
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: optStr,
  SMTP_PASS: optStr,
  EMAIL_FROM: z.string().default('Karnataka Travel AI <alerts@example.com>'),
  WHATSAPP_TOKEN: optStr,
  WHATSAPP_PHONE_NUMBER_ID: optStr,
});
