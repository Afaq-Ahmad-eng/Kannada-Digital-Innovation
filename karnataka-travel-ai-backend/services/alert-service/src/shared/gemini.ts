import { GeminiClient } from '@kta/service-kit';
import { env } from '../config';
import { log } from './logger';

export const gemini = new GeminiClient(
  { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, embedModel: env.GEMINI_EMBED_MODEL, embedDims: env.EMBED_DIMS },
  log,
);
