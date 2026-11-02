import { commonEnv, geminiEnv, loadEnv, optStr, z } from '@kta/service-kit';

export const env = loadEnv({
  ...commonEnv,
  ...geminiEnv,
  DATABASE_URL: z.string().min(1),
  RESEED_KNOWLEDGE: z.enum(['true', 'false']).default('false'),
  /** OpenAI-compatible Whisper endpoint (OpenAI, or a self-hosted faster-whisper / whisper.cpp server). */
  WHISPER_BASE_URL: z.string().default('https://api.openai.com/v1'),
  WHISPER_API_KEY: optStr,
  WHISPER_MODEL: z.string().default('whisper-1'),
  GOOGLE_TTS_API_KEY: optStr,
});
