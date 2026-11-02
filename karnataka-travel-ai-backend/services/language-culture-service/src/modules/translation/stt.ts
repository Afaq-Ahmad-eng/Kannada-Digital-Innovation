import { AppError } from '@kta/service-kit';
import { env } from '../../config';

/** Speech-to-text via an OpenAI-compatible Whisper endpoint. */
export async function transcribe(audio: Buffer, filename: string, mimeType: string, language?: 'kn' | 'en'): Promise<string> {
  if (!env.WHISPER_API_KEY) throw new AppError(503, 'Speech recognition is not configured. Send "text" instead, or set WHISPER_API_KEY.', 'STT_NOT_CONFIGURED');
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type: mimeType }), filename);
  form.append('model', env.WHISPER_MODEL);
  form.append('response_format', 'json');
  if (language) form.append('language', language);
  const res = await fetch(`${env.WHISPER_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.WHISPER_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new AppError(502, 'Speech recognition failed', 'STT_FAILED', (await res.text()).slice(0, 200));
  const data = (await res.json()) as { text?: string };
  return (data.text ?? '').trim();
}
