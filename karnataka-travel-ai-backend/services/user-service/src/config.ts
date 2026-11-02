import { commonEnv, loadEnv, z } from '@kta/service-kit';

export const env = loadEnv({ ...commonEnv, DATABASE_URL: z.string().min(1) });
