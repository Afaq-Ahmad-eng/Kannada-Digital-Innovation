import { AppError, z } from '@kta/service-kit';
import { gemini } from '../../shared/gemini';
import { phrasebookLookup } from './phrasebook';
import { transcribe } from './stt';
import { synthesize } from './tts';

const TranslationSchema = z.object({
  sourceLang: z.enum(['kn', 'en']),
  transcript: z.string(),
  translation: z.string(),
  phonetic: z.string().default(''),
  notes: z.string().default(''),
});

const TRANSLATE_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    sourceLang: { type: 'STRING', enum: ['kn', 'en'] },
    transcript: { type: 'STRING' },
    translation: { type: 'STRING' },
    phonetic: { type: 'STRING' },
    notes: { type: 'STRING' },
  },
  required: ['sourceLang', 'transcript', 'translation', 'phonetic', 'notes'],
};

export interface TranslateInput {
  audio?: { buffer: Buffer; filename: string; mimeType: string };
  text?: string;
  sourceLang: 'kn' | 'en' | 'auto';
  context?: string;
  speak: boolean;
}

export async function translateVoice(input: TranslateInput) {
  let transcript = input.text?.trim() ?? '';
  if (!transcript) {
    if (!input.audio) throw new AppError(400, 'Provide an "audio" file or "text".', 'NO_INPUT');
    transcript = await transcribe(input.audio.buffer, input.audio.filename, input.audio.mimeType, input.sourceLang === 'auto' ? undefined : input.sourceLang);
  }
  if (!transcript) throw new AppError(422, 'Could not hear any speech. Please try again.', 'EMPTY_TRANSCRIPT');

  let result: z.infer<typeof TranslationSchema>;
  if (gemini.enabled) {
    const raw = await gemini.generateJson(
      `Detect whether this utterance is Kannada or English (hint: ${input.sourceLang}), then translate it to the other language.\n` +
        `Situation: ${input.context || 'a traveller talking with a local in Karnataka'}.\n` +
        `Utterance: """${transcript}"""\n` +
        `Return: sourceLang, a lightly cleaned transcript, a natural polite translation suited to the situation (everyday spoken Kannada, not formal literary), ` +
        `phonetic = Latin-script pronunciation of whichever side is Kannada, and notes = one short cultural/usage tip (may be empty).`,
      TRANSLATE_JSON_SCHEMA,
      { system: 'You are a precise English<->Kannada interpreter for travellers. Keep translations short and natural.', temperature: 0.2 },
    );
    result = TranslationSchema.parse(raw);
  } else {
    const hit = phrasebookLookup(transcript);
    if (!hit) throw new AppError(503, 'Translation needs GEMINI_API_KEY; only a few built-in phrases work offline.', 'TRANSLATION_NOT_CONFIGURED');
    const fromKn = transcript.includes(hit.kn);
    result = { sourceLang: fromKn ? 'kn' : 'en', transcript, translation: fromKn ? hit.en : hit.kn, phonetic: hit.phonetic, notes: 'Offline phrasebook result.' };
  }

  const targetLang = result.sourceLang === 'kn' ? 'en' : 'kn';
  const audio = input.speak ? await synthesize(result.translation, targetLang) : null;
  return { ...result, targetLang, audio };
}
