import { z } from 'zod';

/** Optional string: empty values (e.g. `KEY=` in .env) become undefined. */
export const optStr = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

export const commonEnv = {
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default('info'),
  KAFKA_BROKERS: z.string().default(process.env.KAFKA_BROKER ?? 'localhost:19092'),
  KAFKA_SSL: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  KAFKA_USERNAME: optStr,
  KAFKA_PASSWORD: optStr,
  KAFKA_SASL_MECHANISM: z.enum(['plain', 'scram-sha-256', 'scram-sha-512']).default('scram-sha-256'),
  KAFKA_CA_CERT_BASE64: optStr,
  INTERNAL_API_KEY: z.string().min(16, 'INTERNAL_API_KEY must be at least 16 characters'),
};

export const geminiEnv = {
  GEMINI_API_KEY: optStr,
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_EMBED_MODEL: z.string().default('gemini-embedding-001'),
  EMBED_DIMS: z.coerce.number().int().default(768),
};

/** Validate process.env against a zod shape; exit(1) with a readable message when invalid. */
export function loadEnv<T extends z.ZodRawShape>(shape: T): z.infer<z.ZodObject<T>> {
  const result = z.object(shape).safeParse(process.env);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:', JSON.stringify(result.error.flatten().fieldErrors, null, 2));
    process.exit(1);
  }
  return result.data as z.infer<z.ZodObject<T>>;
}

export { z };
