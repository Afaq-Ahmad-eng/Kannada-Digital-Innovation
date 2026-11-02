import { http } from '../../../services/http';

export interface Translation {
  sourceLang: 'kn' | 'en';
  targetLang: 'kn' | 'en';
  transcript: string;
  translation: string;
  phonetic: string;
  notes: string;
  audio: { audioBase64: string; mimeType: string } | null;
}
export interface Phrase { english: string; kannada: string; phonetic: string }
export interface Guide {
  mode: 'RAG' | 'RETRIEVAL_ONLY';
  answer: string;
  etiquetteTips: string[];
  phrases: Phrase[];
  sources: { id: string; title: string; score: number }[];
}
export type GuideTopic = 'TEMPLE' | 'FOOD' | 'PHRASES' | 'ETIQUETTE' | 'TRANSPORT';

export const cultureApi = {
  translate: (input: { audio?: Blob; text?: string; sourceLang: 'auto' | 'kn' | 'en'; context?: string }) => {
    const form = new FormData();
    if (input.audio) {
      const ext = input.audio.type.includes('mp4') ? 'm4a' : input.audio.type.includes('ogg') ? 'ogg' : 'webm';
      form.append('audio', input.audio, `speech.${ext}`);
    }
    if (input.text) form.append('text', input.text);
    form.append('sourceLang', input.sourceLang);
    if (input.context) form.append('context', input.context);
    return http.post<Translation>('/language/translate-voice', form, { timeout: 90_000 }).then((r) => r.data);
  },
  guide: (query: string, topic?: GuideTopic) => http.post<Guide>('/language/cultural-guide', { query, topic }).then((r) => r.data),
};
