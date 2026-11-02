import { env } from '../../config';
import { log } from '../../shared/logger';

export interface SynthesizedAudio {
  audioBase64: string;
  mimeType: string;
}

/** Google Cloud Text-to-Speech. Returns null when not configured; clients fall back to browser speech synthesis. */
export async function synthesize(text: string, lang: 'kn' | 'en'): Promise<SynthesizedAudio | null> {
  if (!env.GOOGLE_TTS_API_KEY || !text) return null;
  try {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${env.GOOGLE_TTS_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: lang === 'kn' ? 'kn-IN' : 'en-IN' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const data = (await res.json()) as { audioContent?: string };
    return data.audioContent ? { audioBase64: data.audioContent, mimeType: 'audio/mpeg' } : null;
  } catch (err) {
    log.warn({ err }, 'TTS failed; client will use browser speech synthesis');
    return null;
  }
}
