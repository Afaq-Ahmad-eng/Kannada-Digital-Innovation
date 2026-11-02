import { commonEnv, geminiEnv, loadEnv, z } from '@kta/service-kit';

export const env = loadEnv({ ...commonEnv, ...geminiEnv, DATABASE_URL: z.string().min(1) });
